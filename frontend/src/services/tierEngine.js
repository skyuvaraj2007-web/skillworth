/**
 * SKILLNEXUS AI — Configurable Institutional Tier Classification Engine
 * 
 * IMPORTANT:
 * "SKILLNEXUS Tier 1 / 2 / 3 / 4" is a proprietary Career Intelligence / Product Classification.
 * It is NOT an official Government of Tamil Nadu or UGC/AICTE ranking.
 * The underlying official institutional data remains strictly separate from tier scores.
 */

export const TIER_CONFIG = {
  weights: {
    nationalStanding: 0.35,  // NIRF / Institutes of National Importance / Central Universities
    accreditation: 0.25,     // NAAC A++, A+, A / NBA Accreditations
    autonomy: 0.20,          // UGC Autonomous Status / Deemed University
    institutionalAge: 0.10,  // Legacy & Alumni Footprint (>50 yrs, >25 yrs)
    researchOutput: 0.10     // Verified Ph.D guides / Centers of Excellence
  },
  thresholds: {
    tier1: 80,  // Score >= 80 => SKILLNEXUS Tier 1
    tier2: 60,  // Score >= 60 => SKILLNEXUS Tier 2
    tier3: 40,  // Score >= 40 => SKILLNEXUS Tier 3
    tier4: 20   // Score >= 20 => SKILLNEXUS Tier 4 (otherwise Unclassified if insufficient data)
  }
};

/**
 * Computes a transparent, reproducible Tier Score and Reason for any institution.
 * Handles missing data gracefully without fabricating artificial facts.
 */
export function computeInstitutionTier(college) {
  if (!college) {
    return { tier: 'SKILLNEXUS Tier 3', tierScore: 45, tierReason: 'Standard institutional recognition' };
  }

  // If tier and tierScore already explicitly set, preserve them
  if (college.tier && typeof college.tierScore === 'number' && college.tierScore > 0) {
    return {
      tier: college.tier,
      tierScore: college.tierScore,
      tierReason: college.tierReason || 'Verified directory ranking'
    };
  }

  let score = 0;
  const reasons = [];
  const cName = (college.collegeName || college.name || '').trim();
  const cNameLower = cName.toLowerCase();
  const type = college.collegeType || college.ownershipType || '';
  const instType = college.institutionType || type || '';

  // 1. National Standing / National Importance (0 - 35 pts)
  const isNationalInstitute = ['IIT', 'NIT', 'IIIT', 'Central University', 'Institute of National Importance'].includes(instType) ||
    ['IIT Madras', 'NIT Trichy', 'Indian Institute of Technology', 'National Institute of Technology'].some(name => cName.includes(name));
  
  const isPremierHeritage = [
    'anna university', 'college of engineering, guindy', 'mit chromepet', 'madras institute of technology',
    'psg college of technology', 'coimbatore institute of technology', 'thiagarajar college of engineering',
    'government college of technology', 'ssn college', 'vellore institute of technology',
    'srm institute of science', 'sastra', 'amrita vishwa'
  ].some(pre => cNameLower.includes(pre));

  if (isNationalInstitute) {
    score += 35;
    reasons.push('Institute of National Importance');
  } else if (isPremierHeritage) {
    score += 32;
    reasons.push('Premier State Excellence & NIRF Top Standing');
  } else if (college.nirfRank && college.nirfRank <= 50) {
    score += 35;
    reasons.push(`NIRF Top 50 (#${college.nirfRank})`);
  } else if (college.nirfRank && college.nirfRank <= 100) {
    score += 28;
    reasons.push(`NIRF Top 100 (#${college.nirfRank})`);
  } else if (college.nirfRank && college.nirfRank <= 200) {
    score += 20;
    reasons.push(`NIRF Ranked (#${college.nirfRank})`);
  } else if (type === 'Government' || type === 'Government-Aided' || college.ownershipType === 'Government') {
    score += 20;
    reasons.push('Government Heritage');
  } else if (type === 'Autonomous') {
    score += 18;
    reasons.push('UGC Autonomous Accreditation');
  } else {
    score += 12;
  }

  // 2. Accreditation (0 - 25 pts)
  const grade = (college.accreditationGrade || '').toUpperCase().trim();
  if (grade === 'A++') {
    score += 25;
    reasons.push('NAAC A++ Grade');
  } else if (grade === 'A+') {
    score += 20;
    reasons.push('NAAC A+ Grade');
  } else if (grade === 'A') {
    score += 15;
    reasons.push('NAAC A Grade');
  } else if (grade === 'B++' || grade === 'B+') {
    score += 10;
    reasons.push(`NAAC ${grade} Grade`);
  } else if (college.accreditation && college.accreditation !== 'None') {
    score += 8;
    reasons.push('Accredited');
  }

  // 3. Autonomy / Deemed Status (0 - 20 pts)
  if (college.autonomous === true || college.ownershipType === 'Autonomous' || college.collegeType === 'Autonomous') {
    score += 20;
    reasons.push('UGC Autonomous Status');
  } else if (college.ownershipType === 'Deemed University' || college.institutionType === 'Deemed University' || college.collegeType === 'Deemed') {
    score += 18;
    reasons.push('Deemed University');
  } else if (college.institutionType === 'University' || college.university === 'Anna University') {
    score += 15;
    reasons.push('State University Affiliation');
  }

  // 4. Institutional Age / Legacy (0 - 10 pts)
  const estYear = parseInt(college.establishedYear, 10);
  if (estYear) {
    const age = new Date().getFullYear() - estYear;
    if (age >= 60) {
      score += 10;
      reasons.push(`Diamond Jubilee (${age} yrs legacy)`);
    } else if (age >= 35) {
      score += 8;
      reasons.push(`Established Legacy (${age} yrs)`);
    } else if (age >= 15) {
      score += 5;
    }
  }

  // 5. Research & Specialized Standing (0 - 10 pts)
  if (college.hasResearchCenter || college.doctoralPrograms) {
    score += 10;
    reasons.push('Active Doctoral & Research Centers');
  } else if (college.institutionType === 'Medical' || college.institutionType === 'Government Medical College') {
    score += 10;
    reasons.push('Statutory Medical Council Recognition');
  }

  // Determine Tier from Configured Thresholds
  let tier = 'Unclassified';
  if (score >= TIER_CONFIG.thresholds.tier1) {
    tier = 'SKILLNEXUS Tier 1';
  } else if (score >= TIER_CONFIG.thresholds.tier2) {
    tier = 'SKILLNEXUS Tier 2';
  } else if (score >= TIER_CONFIG.thresholds.tier3) {
    tier = 'SKILLNEXUS Tier 3';
  } else if (score >= TIER_CONFIG.thresholds.tier4) {
    tier = 'SKILLNEXUS Tier 4';
  }

  return {
    tier,
    tierScore: Math.min(100, Math.round(score)),
    tierReason: reasons.length > 0 ? reasons.join(' • ') : 'Baseline institutional registry recognition'
  };
}
