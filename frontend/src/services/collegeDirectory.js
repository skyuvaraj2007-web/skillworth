/**
 * SKILLNEXUS AI — Complete Tamil Nadu College Master Directory Service
 * Single source of truth for higher-education institution identity in Tamil Nadu.
 * Built from authoritative sources: Tamil Nadu DCE, UGC, AICTE, and Anna University/TNEA.
 * 
 * Includes configurable SKILLNEXUS Tier 1, Tier 2, Tier 3, Tier 4 classifications
 * (clearly presented as a Career Intelligence / Product classification, NOT official government ranking).
 */

import { getAllRelationalInstitutions, getRelationalInstitutionById, SEED_INSTITUTIONS } from './nexusDataStore.js';
import { computeInstitutionTier } from './tierEngine.js';

export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

export const TN_COLLEGES = [...(SEED_INSTITUTIONS || [])];

/**
 * Fetch and sync institutions dynamically from authoritative backend APIs:
 * 1. /api/college-master (All 137 verified Tamil Nadu institutions across 38 districts)
 * 2. /api/auth/institutions (Registered live institutions with departments)
 */
export async function syncCollegesFromApi() {
  try {
    let loadedColleges = [];

    // 1. Fetch full Tamil Nadu Engineering College Master Directory
    try {
      const masterRes = await fetch('/api/college-master');
      if (masterRes.ok) {
        const masterData = await masterRes.json();
        const list = masterData.colleges || masterData.data || [];
        if (Array.isArray(list) && list.length > 0) {
          loadedColleges = list.map(item => {
            const tierCalc = computeInstitutionTier(item);
            return {
              id: item.id || item.collegeCode,
              collegeId: item.collegeCode || item.id,
              collegeCode: item.collegeCode || item.code || item.id,
              collegeName: item.collegeName || item.name,
              officialName: item.collegeName || item.name,
              shortName: item.shortName || (item.collegeName || '').split(' ')[0],
              district: item.district || 'Tamil Nadu',
              city: item.city || item.district || '',
              institutionType: item.collegeType || item.institutionType || 'Engineering',
              ownershipType: item.collegeType || item.ownershipType || 'Autonomous',
              collegeType: item.collegeType || 'Autonomous',
              universityAffiliation: item.university || 'Anna University',
              university: item.university || 'Anna University',
              tier: tierCalc.tier,
              tierScore: tierCalc.tierScore,
              tierReason: tierCalc.tierReason,
              activeStatus: item.status || 'ACTIVE',
              searchKeywords: `${item.collegeName} ${item.collegeCode} ${item.city} ${item.district} ${item.collegeType}`.toLowerCase()
            };
          });
        }
      }
    } catch (e) {
      console.warn('Note on master colleges fetch:', e.message);
    }

    // 2. Fetch registered institutions and merge/upgrade
    try {
      const regRes = await fetch('/api/auth/institutions?state=Tamil+Nadu');
      if (regRes.ok) {
        const regData = await regRes.json();
        const regList = regData.institutions || regData.data || [];
        if (Array.isArray(regList) && regList.length > 0) {
          regList.forEach(regItem => {
            const match = loadedColleges.find(c =>
              (c.collegeCode && (c.collegeCode === regItem.code || c.collegeCode === regItem.collegeCode)) ||
              (c.collegeId && (c.collegeId === regItem.code || c.collegeId === regItem.collegeId)) ||
              c.collegeName.toLowerCase() === (regItem.name || '').toLowerCase()
            );
            if (match) {
              match.isRegistered = true;
              match.departments = regItem.departments || [];
              match.studentCount = regItem.studentCount || 0;
            } else if (regItem.name) {
              const tierCalc = computeInstitutionTier(regItem);
              loadedColleges.push({
                id: regItem.id || regItem.code,
                collegeId: regItem.code || regItem.collegeId || regItem.id,
                collegeCode: regItem.code || regItem.collegeId,
                collegeName: regItem.name || regItem.collegeName,
                officialName: regItem.name,
                shortName: regItem.name.split(' ')[0],
                district: regItem.district || 'Tamil Nadu',
                city: regItem.city || regItem.district || '',
                institutionType: regItem.campusType || regItem.type || 'Engineering',
                ownershipType: regItem.type || 'Autonomous',
                collegeType: regItem.campusType || regItem.type || 'Autonomous',
                universityAffiliation: regItem.university || 'Anna University',
                university: regItem.university || 'Anna University',
                tier: tierCalc.tier,
                tierScore: tierCalc.tierScore,
                tierReason: tierCalc.tierReason,
                activeStatus: 'ACTIVE',
                isRegistered: true,
                departments: regItem.departments || [],
                searchKeywords: `${regItem.name} ${regItem.code} ${regItem.city} ${regItem.district}`.toLowerCase()
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Note on registered institutions fetch:', e.message);
    }

    if (loadedColleges.length > 0) {
      TN_COLLEGES.length = 0;
      loadedColleges.forEach(col => TN_COLLEGES.push(col));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_directory_updated', { detail: { count: TN_COLLEGES.length } }));
    }
  } catch (err) {
    console.warn('Error syncing colleges in directory:', err);
  }
  return TN_COLLEGES;
}

// Auto-sync in browser
if (typeof window !== 'undefined') {
  syncCollegesFromApi().catch(() => {});
}

/**
 * High-performance search against the master directory with prioritized ranking
 */
export function searchColleges(query, limit = 10, includeInactive = false) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const q = query.trim().toLowerCase();
  const scored = [];

  for (let i = 0; i < TN_COLLEGES.length; i++) {
    const col = TN_COLLEGES[i];

    // Filter inactive unless explicitly requested
    if (!includeInactive && col.activeStatus && col.activeStatus !== 'ACTIVE') {
      continue;
    }

    const name = (col.collegeName || col.name || '').toLowerCase();
    const official = (col.officialName || col.name || '').toLowerCase();
    const short = (col.shortName || col.short_name || '').toLowerCase();
    const city = (col.city || col.district || '').toLowerCase();
    const district = (col.district || '').toLowerCase();
    const code = (col.collegeId || col.code || col.collegeCode || '').toLowerCase();
    const keywords = col.searchKeywords || '';

    let score = 0;

    // 1. Exact Name / ShortName / Code Match
    if (name === q || official === q || short === q || code === q) {
      score = 100;
    }
    // 2. Exact Alias Match (e.g. 'SRM', 'PSG', 'SSN', 'VIT')
    else if (col.aliases && col.aliases.some(a => a.toLowerCase() === q)) {
      score = 95;
    }
    // 3. Starts-with match on official title / short name
    else if (name.startsWith(q) || short.startsWith(q) || official.startsWith(q) || code.startsWith(q)) {
      score = 80;
    }
    // 4. Starts-with alias match
    else if (col.aliases && col.aliases.some(a => a.toLowerCase().startsWith(q))) {
      score = 75;
    }
    // 5. Partial Name match
    else if (name.includes(q) || official.includes(q)) {
      score = 60;
    }
    // 6. City / District match
    else if (city === q || district === q) {
      score = 55;
    } else if (city.startsWith(q) || district.startsWith(q)) {
      score = 50;
    } else if (city.includes(q) || district.includes(q)) {
      score = 45;
    }
    // 7. Search Keyword match
    else if (keywords.includes(q)) {
      score = 30;
    }

    if (score > 0) {
      const tieBreaker = (col.tierScore || 0) * 0.1;
      scored.push({ college: col, score: score + tieBreaker });
    }
  }

  // Sort descending by score, then alphabetically
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const nameA = a.college.collegeName || a.college.name || '';
    const nameB = b.college.collegeName || b.college.name || '';
    return nameA.localeCompare(nameB);
  });

  return scored.slice(0, limit).map(item => item.college);
}

/**
 * Direct lookup by unique collegeId.
 */
export function getCollegeById(collegeId) {
  if (!collegeId) return null;
  const str = String(collegeId).toLowerCase().trim();
  const fromMemory = TN_COLLEGES.find(c =>
    (c.collegeId && String(c.collegeId).toLowerCase() === str) ||
    (c.id && String(c.id).toLowerCase() === str) ||
    (c.code && String(c.code).toLowerCase() === str) ||
    (c.collegeCode && String(c.collegeCode).toLowerCase() === str)
  );
  if (fromMemory) return fromMemory;
  const found = getRelationalInstitutionById(collegeId);
  if (found) return found;
  const all = getAllRelationalInstitutions();
  return all.find(c => (c.collegeId || c.institutionId || '').toLowerCase() === str) || null;
}

/**
 * Lookup by exact college name or alias (case-insensitive).
 */
export function getCollegeByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return TN_COLLEGES.find(c =>
    c.collegeName.toLowerCase() === n ||
    c.officialName.toLowerCase() === n ||
    (c.aliases && c.aliases.some(a => a.toLowerCase() === n))
  ) || null;
}

/**
 * Filter directory by multiple criteria for administrative inspection or directory views.
 */
export function filterDirectory({
  district = 'ALL',
  institutionType = 'ALL',
  tier = 'ALL',
  ownershipType = 'ALL',
  activeStatus = 'ALL',
  search = ''
}) {
  let list = TN_COLLEGES;

  if (district !== 'ALL') {
    list = list.filter(c => (c.district || '').toLowerCase() === district.toLowerCase());
  }
  if (institutionType !== 'ALL') {
    list = list.filter(c =>
      (c.institutionType && c.institutionType.toLowerCase() === institutionType.toLowerCase()) ||
      (c.collegeType && c.collegeType.toLowerCase() === institutionType.toLowerCase())
    );
  }
  if (tier !== 'ALL') {
    list = list.filter(c => c.tier === tier);
  }
  if (ownershipType !== 'ALL') {
    list = list.filter(c =>
      c.ownershipType === ownershipType ||
      c.collegeType === ownershipType
    );
  }
  if (activeStatus !== 'ALL') {
    list = list.filter(c => c.activeStatus === activeStatus);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(c =>
      (c.collegeName && c.collegeName.toLowerCase().includes(q)) ||
      (c.officialName && c.officialName.toLowerCase().includes(q)) ||
      (c.collegeId && String(c.collegeId).toLowerCase().includes(q)) ||
      (c.collegeCode && String(c.collegeCode).toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.searchKeywords && c.searchKeywords.includes(q))
    );
  }

  return list;
}

/**
 * Directory Metadata & Tier Breakdown Statistics
 */
export function getDirectoryStats() {
  const stats = {
    total: TN_COLLEGES.length,
    active: 0,
    inactive: 0,
    districtsCount: 0,
    tiers: {
      'SKILLNEXUS Tier 1': 0,
      'SKILLNEXUS Tier 2': 0,
      'SKILLNEXUS Tier 3': 0,
      'SKILLNEXUS Tier 4': 0,
      'Unclassified': 0
    },
    ownerships: {},
    sources: [
      'Tamil Nadu Directorate of Collegiate Education (DCE)',
      'University Grants Commission (UGC)',
      'Anna University / TNEA',
      'Ministry of Education / NIRF',
      'National Medical Commission (NMC)'
    ]
  };

  const districtSet = new Set();

  TN_COLLEGES.forEach(c => {
    if (c.activeStatus === 'ACTIVE') stats.active++;
    else stats.inactive++;

    if (c.district) districtSet.add(c.district);

    if (stats.tiers[c.tier] !== undefined) {
      stats.tiers[c.tier]++;
    } else {
      stats.tiers['Unclassified']++;
    }

    const own = c.ownershipType || 'Other';
    stats.ownerships[own] = (stats.ownerships[own] || 0) + 1;
  });

  stats.districtsCount = districtSet.size;
  return stats;
}

/**
 * Unique list of all 38 Tamil Nadu districts.
 */
export function getAllDistricts() {
  const set = new Set(TAMIL_NADU_DISTRICTS);
  TN_COLLEGES.forEach(c => {
    if (c.district) set.add(c.district);
  });
  return Array.from(set).sort();
}

/**
 * Returns exact count of institutions per district.
 */
export function getDistrictCounts() {
  const counts = {};
  TAMIL_NADU_DISTRICTS.forEach(d => { counts[d] = 0; });
  TN_COLLEGES.forEach(c => {
    if (c.district) {
      counts[c.district] = (counts[c.district] || 0) + 1;
    }
  });
  return counts;
}

/**
 * Unique list of institution types.
 */
export function getAllInstitutionTypes() {
  const set = new Set(['Autonomous', 'Government', 'Government-Aided', 'Self-Financing', 'Deemed']);
  TN_COLLEGES.forEach(c => {
    if (c.institutionType) set.add(c.institutionType);
    if (c.collegeType) set.add(c.collegeType);
  });
  return Array.from(set).sort();
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE CATALOG (Learning Page)
// Each institution shares the NEXUS platform catalog; additionally they may
// have institution-specific tracks. For now we use a shared + college-id-based
// set of courses to power the Course Catalog tab.
// ─────────────────────────────────────────────────────────────────────────────

const NEXUS_CATALOG = [
  // ── Shared Platform Courses ─────────────────────────────────────────────────
  { courseId: 'COURSE-001', title: 'Python for Data Science', category: 'DATA & AI', level: 'Beginner → Intermediate', durationWeeks: 8, totalModules: 24, module1: 'Variables & Types', color: '#28D7FF', tags: ['Python', 'Pandas', 'NumPy', 'Visualization'], collegeIds: null },
  { courseId: 'COURSE-002', title: 'Generative AI Fundamentals', category: 'BY NEXUS AI', level: 'Intermediate', durationWeeks: 6, totalModules: 12, module1: 'Transformers Basics', color: '#8B5CF6', tags: ['LLMs', 'Prompting', 'RAG', 'Vector DBs'], collegeIds: null },
  { courseId: 'COURSE-003', title: 'Advanced SQL for Data Engineering', category: 'DATABASE', level: 'Advanced', durationWeeks: 4, totalModules: 13, module1: 'Relational Model', color: '#2FE0A1', tags: ['SQL', 'Indexing', 'CTEs', 'Partitioning'], collegeIds: null },
  { courseId: 'COURSE-004', title: 'Data Analytics Foundations', category: 'ANALYTICS', level: 'Beginner', durationWeeks: 5, totalModules: 12, module1: 'Intro to Analytics', color: '#3478FF', tags: ['Excel', 'Tableau', 'Statistics'], collegeIds: null },
  { courseId: 'COURSE-005', title: 'Machine Learning with Scikit-Learn', category: 'ML', level: 'Intermediate', durationWeeks: 7, totalModules: 18, module1: 'Supervised Learning', color: '#F59E0B', tags: ['ML', 'Scikit-Learn', 'Classification', 'Regression'], collegeIds: null },
  { courseId: 'COURSE-006', title: 'Deep Learning & Neural Networks', category: 'DEEP LEARNING', level: 'Advanced', durationWeeks: 8, totalModules: 20, module1: 'Perceptrons & Activations', color: '#EC4899', tags: ['PyTorch', 'CNN', 'RNN', 'Transformers'], collegeIds: null },
  { courseId: 'COURSE-007', title: 'Web Development with React 18', category: 'WEB DEV', level: 'Intermediate', durationWeeks: 6, totalModules: 15, module1: 'JSX & Components', color: '#06B6D4', tags: ['React', 'Hooks', 'State', 'API'], collegeIds: null },
  { courseId: 'COURSE-008', title: 'Cloud & DevOps Essentials', category: 'CLOUD', level: 'Intermediate', durationWeeks: 5, totalModules: 14, module1: 'Cloud Fundamentals', color: '#6366F1', tags: ['AWS', 'Docker', 'CI/CD', 'Kubernetes'], collegeIds: null },
  { courseId: 'COURSE-009', title: 'Cybersecurity Fundamentals', category: 'SECURITY', level: 'Beginner → Intermediate', durationWeeks: 6, totalModules: 16, module1: 'Threat Landscape', color: '#10B981', tags: ['Security', 'OWASP', 'Cryptography', 'Networking'], collegeIds: null },
  { courseId: 'COURSE-010', title: 'Logical Reasoning & Aptitude Mastery', category: 'APTITUDE', level: 'All Levels', durationWeeks: 4, totalModules: 10, module1: 'Number Systems', color: '#F97316', tags: ['Reasoning', 'Aptitude', 'Placement Prep'], collegeIds: null },
  { courseId: 'COURSE-011', title: 'NLP & Text Analytics', category: 'NLP', level: 'Advanced', durationWeeks: 6, totalModules: 16, module1: 'Tokenization & Embeddings', color: '#A78BFA', tags: ['NLTK', 'spaCy', 'BERT', 'Sentiment'], collegeIds: null },
  { courseId: 'COURSE-012', title: 'IoT & Embedded Systems', category: 'IOT', level: 'Intermediate', durationWeeks: 5, totalModules: 14, module1: 'Microcontroller Basics', color: '#34D399', tags: ['Arduino', 'Raspberry Pi', 'MQTT', 'Sensors'], collegeIds: null },
  { courseId: 'COURSE-013', title: 'Full Stack Java Development', category: 'JAVA', level: 'Intermediate', durationWeeks: 8, totalModules: 20, module1: 'Java OOP Basics', color: '#FB923C', tags: ['Java', 'Spring Boot', 'Hibernate', 'REST'], collegeIds: null },
  { courseId: 'COURSE-014', title: 'System Design & Architecture', category: 'SYSTEMS', level: 'Advanced', durationWeeks: 5, totalModules: 12, module1: 'Scalability Principles', color: '#818CF8', tags: ['HLD', 'LLD', 'Microservices', 'CAP'], collegeIds: null },
  { courseId: 'COURSE-015', title: 'Blockchain & Web3 Fundamentals', category: 'BLOCKCHAIN', level: 'Beginner → Intermediate', durationWeeks: 5, totalModules: 12, module1: 'Distributed Ledger Basics', color: '#F472B6', tags: ['Ethereum', 'Solidity', 'DeFi', 'Smart Contracts'], collegeIds: null },
];

/**
 * Return courses available to a student at a given institution.
 * All NEXUS platform courses (collegeIds: null) are always shown.
 * Any institution-specific courses (collegeIds: [id,...]) are shown only if matched.
 */
export function getCoursesByCollegeId(collegeId) {
  return NEXUS_CATALOG.filter(c =>
    c.collegeIds === null ||
    (Array.isArray(c.collegeIds) && c.collegeIds.includes(collegeId))
  );
}
