/**
 * SkillNexus PostgreSQL Migration & ETL Engine (Phase 2.2)
 *
 * Migrates prototype datasets into the PostgreSQL database:
 * - backend/data/relational_db.json
 * - backend/src/db/seedData.js
 * - frontend/src/services/collegeDirectory.js & nexusDataStore.js
 * - frontend/src/services/assessmentStore.js
 *
 * Strictly decoupled: Does NOT alter frontend code.
 * Safe & Idempotent: Runs inside an atomic transaction.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = require(path.resolve(__dirname, '../../node_modules/pg'));

// Command-line flag parsing
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run');
const IS_VALIDATE_ONLY = args.includes('--validate-only');

console.log('================================================================');
console.log('      SKILLNEXUS POSTGRESQL DATA MIGRATION ENGINE (PHASE 2.2)   ');
console.log('================================================================');
console.log(`Execution Mode: ${IS_DRY_RUN ? 'DRY-RUN (NO CHANGES APPLIED)' : IS_VALIDATE_ONLY ? 'VALIDATE-ONLY' : 'TRANSACTIONAL EXECUTION'}`);
console.log(`Target Database: ${process.env.DATABASE_URL ? 'PostgreSQL (via DATABASE_URL)' : (process.env.PGDATABASE || 'skillnexus_db') + ' on ' + (process.env.PGHOST || 'localhost') + ':' + (process.env.PGPORT || 5432)}`);
console.log('----------------------------------------------------------------\n');

// 1. DATA SOURCE LOADERS
function loadDataSources() {
  console.log('[1/14] Loading source datasets...');

  // A. Relational DB
  const relDbPath = path.resolve(__dirname, '../../data/relational_db.json');
  const relDb = JSON.parse(fs.readFileSync(relDbPath, 'utf8'));
  console.log(`  ✓ Loaded relational_db.json (${relDb.users?.length || 0} users, ${relDb.students?.length || 0} students, ${relDb.companies?.length || 0} companies)`);

  // B. Backend seedData.js
  const seedDataPath = path.resolve(__dirname, 'seedData.js');
  const seedData = require(seedDataPath);
  console.log(`  ✓ Loaded seedData.js (${seedData.skills?.length || 0} skills, ${seedData.emergingTechnologies?.length || 0} emerging tech)`);

  // C. Frontend nexusDataStore.js (SEED_INSTITUTIONS)
  const dsPath = path.resolve(__dirname, '../../../frontend/src/services/nexusDataStore.js');
  const dsContent = fs.readFileSync(dsPath, 'utf8');
  const sStart = dsContent.indexOf('export const SEED_INSTITUTIONS = [');
  const sEnd = dsContent.indexOf('];', sStart);
  const seedInstitutions = eval(dsContent.slice(sStart + 'export const SEED_INSTITUTIONS = '.length, sEnd + 1));
  console.log(`  ✓ Loaded SEED_INSTITUTIONS (${seedInstitutions.length} institutions)`);

  // D. Frontend assessmentStore.js
  const asPath = path.resolve(__dirname, '../../../frontend/src/services/assessmentStore.js');
  const asContent = fs.readFileSync(asPath, 'utf8');
  const cleanedAs = asContent
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\.meta(?:\.env)?(?:\.[a-zA-Z0-9_$]+)?/g, 'undefined')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+const\s+QUESTION_BANKS\s*=/, 'const QUESTION_BANKS =')
    .replace(/export\s+/g, '');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(cleanedAs + '\nsandboxData = QUESTION_BANKS;', sandbox);
  const questionBanks = sandbox.sandboxData;
  console.log(`  ✓ Loaded assessmentStore.js (${Object.keys(questionBanks).length} question tracks)\n`);

  return { relDb, seedData, seedInstitutions, questionBanks };
}

// Stats Tracker
const stats = {
  sourceCounts: {},
  migratedCounts: {},
  failedCounts: {},
  duplicatesDetected: [],
  ambiguousMappings: [],
  transformations: []
};

function recordMigration(table, sourceCount, migratedCount, failedCount = 0) {
  stats.sourceCounts[table] = (stats.sourceCounts[table] || 0) + sourceCount;
  stats.migratedCounts[table] = (stats.migratedCounts[table] || 0) + migratedCount;
  stats.failedCounts[table] = (stats.failedCounts[table] || 0) + failedCount;
  console.log(`  ✓ [${table}] Migrated: ${migratedCount} (Source items: ${sourceCount}, Failed/Skipped: ${failedCount})`);
}

async function runMigration() {
  const clientConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '#9942891197@Rudra',
        database: process.env.PGDATABASE || 'skillnexus_db'
      };

  const client = new Client(clientConfig);

  await client.connect();
  console.log('✓ Successfully connected to PostgreSQL database\n');

  if (IS_VALIDATE_ONLY) {
    console.log('VALIDATE-ONLY mode requested. Validating current database state...');
    await performValidations(client);
    await client.end();
    return;
  }

  const { relDb, seedData, seedInstitutions, questionBanks } = loadDataSources();

  // Begin atomic transaction
  await client.query('BEGIN');
  console.log('Transaction started (BEGIN)\n');

  try {
    // -------------------------------------------------------------
    // STEP 1: ROLES MIGRATION
    // -------------------------------------------------------------
    console.log('[2/14] Migrating Roles...');
    const canonicalRoles = [
      { code: 'STUDENT', name: 'Student', description: 'Enrolled university student accessing assessments, digital passports, and placement matching' },
      { code: 'INSTITUTION', name: 'Institution Administrator / Faculty', description: 'Academic leadership, department heads, and faculty evaluators' },
      { code: 'COMPANY', name: 'Company Recruiter / Industry Partner', description: 'Corporate talent acquisition teams, tech hiring managers, and enterprise partners' },
      { code: 'ADMIN', name: 'System Administrator', description: 'SkillNexus platform super-administrators' }
    ];

    const roleMap = new Map(); // code -> uuid
    for (const r of canonicalRoles) {
      const id = crypto.randomUUID();
      await client.query(`
        INSERT INTO roles (id, code, name, description, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, code
      `, [id, r.code, r.name, r.description]);

      const res = await client.query('SELECT id FROM roles WHERE code = $1', [r.code]);
      roleMap.set(r.code, res.rows[0].id);
    }
    recordMigration('roles', canonicalRoles.length, canonicalRoles.length);

    // -------------------------------------------------------------
    // STEP 2: INSTITUTIONS MIGRATION
    // -------------------------------------------------------------
    console.log('[3/14] Migrating Institutions...');
    const instMap = new Map(); // collegeCode -> uuid
    let instMigrated = 0;

    // Detect duplicate TN010 in relational_db
    const tn010Dupes = relDb.institutions.filter(i => (i.collegeId === 'TN010' || i.institutionId === 'TN010'));
    if (tn010Dupes.length > 1) {
      stats.duplicatesDetected.push({
        entity: 'institutions',
        identifier: 'TN010',
        detail: 'Duplicate collegeId TN010 found in relational_db (Tamil Nadu Engineering Institution vs SRM IST). Merged into canonical SRM Institute of Science and Technology.'
      });
    }

    // Unify all sources: seedInstitutions + relDb.institutions
    const unifiedInstitutions = new Map();

    for (const inst of seedInstitutions) {
      const code = inst.institutionId;
      if (!unifiedInstitutions.has(code)) {
        unifiedInstitutions.set(code, {
          code: code,
          name: inst.collegeName,
          shortName: inst.shortName || inst.collegeName.slice(0, 30),
          district: inst.district || 'Chennai',
          state: inst.state || 'Tamil Nadu',
          zone: inst.zone || 'North Zone',
          tier: inst.tier ? (typeof inst.tier === 'number' ? inst.tier : parseInt(inst.tier.replace(/\D/g, '')) || 1) : 1,
          nirfRank: parseInt(inst.nirfRank) || 28,
          naacGrade: inst.naacGrade || 'A++',
          email: inst.email || `admissions@${code.toLowerCase()}.edu.in`,
          website: inst.website || `https://www.${code.toLowerCase()}.edu.in`,
          departments: Array.isArray(inst.departments) && inst.departments.length > 0 ? inst.departments : ['CSE', 'IT', 'AI & DS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Robotics']
        });
      }
    }

    for (const inst of relDb.institutions) {
      const code = inst.collegeCode || inst.institutionId || inst.collegeId || inst.id;
      if (!code) continue;
      if (!unifiedInstitutions.has(code)) {
        const name = inst.collegeName || inst.name || inst.institutionName || code;
        const tierInt = inst.tier ? (typeof inst.tier === 'number' ? inst.tier : parseInt(String(inst.tier).replace(/\D/g, '')) || 1) : 1;
        const cleanTier = (tierInt >= 1 && tierInt <= 4) ? tierInt : 1;
        unifiedInstitutions.set(code, {
          code: code,
          name: name,
          shortName: inst.shortName || name.slice(0, 30),
          district: inst.district || 'Chennai',
          state: inst.state || 'Tamil Nadu',
          zone: inst.zone || 'North Zone',
          tier: cleanTier,
          nirfRank: parseInt(inst.nirfRank) || 35,
          naacGrade: inst.naacGrade || 'A+',
          email: inst.email || inst.officialEmail || `admissions@${code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'inst'}.edu.in`,
          website: inst.website || `https://www.${code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'inst'}.edu.in`,
          departments: Array.isArray(inst.departments) && inst.departments.length > 0 ? inst.departments : ['CSE', 'IT', 'AI & DS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Robotics']
        });
      }
    }

    const seenInstEmails = new Set();
    for (const [code, inst] of unifiedInstitutions.entries()) {
      const instId = crypto.randomUUID();
      let uniqueEmail = inst.email.toLowerCase();
      if (seenInstEmails.has(uniqueEmail)) {
        uniqueEmail = `admissions_${code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@skillnexus.edu.in`;
      }
      seenInstEmails.add(uniqueEmail);

      const insRes = await client.query(`
        INSERT INTO institutions (
          id, code, name, short_name, district, state, zone, tier, nirf_rank, naac_grade,
          is_autonomous, official_email, website_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [
        instId,
        code,
        inst.name,
        inst.shortName,
        inst.district,
        inst.state,
        inst.zone,
        inst.tier,
        inst.nirfRank,
        inst.naacGrade,
        true,
        uniqueEmail,
        inst.website
      ]);

      instMap.set(code, insRes.rows[0].id);
      instMigrated++;
    }

    // Map known aliases
    for (const inst of relDb.institutions) {
      const primaryCode = inst.collegeCode || inst.institutionId || inst.collegeId || inst.id;
      const targetDbId = instMap.get(primaryCode);
      if (targetDbId) {
        if (inst.collegeCode) instMap.set(inst.collegeCode, targetDbId);
        if (inst.institutionId) instMap.set(inst.institutionId, targetDbId);
        if (inst.collegeId) instMap.set(inst.collegeId, targetDbId);
        if (inst.id) instMap.set(inst.id, targetDbId);
      }
    }
    if (instMap.has('TN010')) {
      instMap.set('60e7a0c1-e9e2-4eb5-acaa-437a9d81e436', instMap.get('TN010'));
    }

    recordMigration('institutions', unifiedInstitutions.size, instMigrated);

    // -------------------------------------------------------------
    // STEP 3: DEPARTMENTS MIGRATION
    // -------------------------------------------------------------
    console.log('[4/14] Migrating Departments...');
    const deptFullNameMap = {
      'CSE': 'Computer Science and Engineering',
      'IT': 'Information Technology',
      'AI & DS': 'Artificial Intelligence and Data Science',
      'ECE': 'Electronics and Communication Engineering',
      'EEE': 'Electrical and Electronics Engineering',
      'EE': 'Electrical Engineering',
      'Mechanical': 'Mechanical Engineering',
      'Civil': 'Civil Engineering',
      'Robotics': 'Robotics and Automation Engineering',
      'Chemical': 'Chemical Engineering',
      'Data Science': 'Data Science and Engineering',
      'Aerospace': 'Aerospace Engineering'
    };

    const standardDeptCodes = ['CSE', 'IT', 'AI & DS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Robotics'];
    const deptMap = new Map(); // `${instCode}_${deptCode}` -> uuid
    let deptCount = 0;

    const deptRows = [];
    for (const [code, inst] of unifiedInstitutions.entries()) {
      const instDbId = instMap.get(code);
      const allDepts = new Set([...(inst.departments || []), ...standardDeptCodes]);

      for (const dCode of allDepts) {
        const dName = deptFullNameMap[dCode] || `${dCode} Engineering`;
        const deptId = crypto.randomUUID();
        deptRows.push({ code, dCode, dName, instDbId, deptId });
      }
    }

    const DEPT_BATCH_SIZE = 50;
    for (let i = 0; i < deptRows.length; i += DEPT_BATCH_SIZE) {
      const chunk = deptRows.slice(i, i + DEPT_BATCH_SIZE);
      const valStrings = chunk.map((_, idx) => `($${idx*4+1}, $${idx*4+2}, $${idx*4+3}, $${idx*4+4}, CURRENT_TIMESTAMP)`).join(', ');
      const params = chunk.flatMap(d => [d.deptId, d.instDbId, d.dCode, d.dName]);
      const res = await client.query(`
        INSERT INTO departments (id, institution_id, code, name, created_at)
        VALUES ${valStrings}
        ON CONFLICT (institution_id, code) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, institution_id, code
      `, params);

      for (const row of res.rows) {
        const item = chunk.find(c => c.instDbId === row.institution_id && c.dCode === row.code);
        if (item) deptMap.set(`${item.code}_${row.code}`, row.id);
        deptMap.set(`${row.institution_id}_${row.code}`, row.id);
        deptCount++;
      }
    }
    recordMigration('departments', deptCount, deptCount);

    // -------------------------------------------------------------
    // STEP 4: USERS & USER_ROLES MIGRATION
    // -------------------------------------------------------------
    console.log('[5/14] Migrating Users & User Roles...');
    const userMap = new Map(); // email/sourceId -> uuid
    const defaultStudentPasswordHash = '$2b$10$bidafvs9ecyWGFZT1BtXVulhJpl2ERnA4ts38.aGmMhzS9UiDXsMC'; // Verified bcrypt hash

    // Collect all unique user accounts from relational_db and students
    const userAccounts = new Map(); // email -> userData

    // A. From relDb.users
    for (const u of relDb.users) {
      userAccounts.set(u.email.toLowerCase(), {
        sourceId: u.id,
        email: u.email.toLowerCase(),
        passwordHash: u.passwordHash || defaultStudentPasswordHash,
        roleCode: u.role ? u.role.toUpperCase() : 'STUDENT',
        name: u.name,
        collegeId: u.collegeId,
        companyId: u.companyId
      });
    }

    // B. From relDb.students (ensure all 16 students have valid users)
    for (const s of relDb.students) {
      const email = (s.email || `${s.studentId.toLowerCase()}@nexus.edu`).toLowerCase();
      if (!userAccounts.has(email)) {
        userAccounts.set(email, {
          sourceId: s.userId || `usr_${s.studentId}`,
          email: email,
          passwordHash: defaultStudentPasswordHash,
          roleCode: 'STUDENT',
          name: s.name,
          collegeId: s.collegeId,
          companyId: null
        });
        stats.transformations.push(`Synthesized user account for student ${s.studentId} (${s.name}, email: ${email}) with secure bcrypt hash`);
      }
    }

    let usersMigrated = 0;
    let userRolesMigrated = 0;

    const userList = Array.from(userAccounts.values()).map(u => ({
      ...u,
      userId: crypto.randomUUID()
    }));

    const USER_BATCH_SIZE = 50;
    for (let i = 0; i < userList.length; i += USER_BATCH_SIZE) {
      const chunk = userList.slice(i, i + USER_BATCH_SIZE);
      const valStrings = chunk.map((_, idx) => `($${idx*3+1}, $${idx*3+2}, $${idx*3+3}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).join(', ');
      const params = chunk.flatMap(u => [u.userId, u.email, u.passwordHash]);
      const res = await client.query(`
        INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
        VALUES ${valStrings}
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id, email
      `, params);

      for (const row of res.rows) {
        const u = chunk.find(item => item.email === row.email);
        const dbUserId = row.id;
        userMap.set(row.email, dbUserId);
        if (u && u.sourceId) userMap.set(u.sourceId, dbUserId);
        usersMigrated++;
      }
    }

    const userRoleRows = [];
    const instMemberRows = [];
    for (const u of userList) {
      const dbUserId = userMap.get(u.email);
      const roleId = roleMap.get(u.roleCode) || roleMap.get('STUDENT');
      if (dbUserId && roleId) {
        userRoleRows.push({ urId: crypto.randomUUID(), dbUserId, roleId });
      }
      if (u.roleCode === 'INSTITUTION' && u.collegeId && instMap.has(u.collegeId) && dbUserId) {
        const memId = crypto.randomUUID();
        const memRole = u.email.includes('dean') ? 'DEAN' : 'PLACEMENT_OFFICER';
        instMemberRows.push({ memId, instId: instMap.get(u.collegeId), dbUserId, memRole, name: u.name || 'Academic Administrator' });
      }
    }

    for (let i = 0; i < userRoleRows.length; i += 50) {
      const chunk = userRoleRows.slice(i, i + 50);
      const valStrings = chunk.map((_, idx) => `($${idx*3+1}, $${idx*3+2}, $${idx*3+3}, CURRENT_TIMESTAMP)`).join(', ');
      const params = chunk.flatMap(ur => [ur.urId, ur.dbUserId, ur.roleId]);
      await client.query(`
        INSERT INTO user_roles (id, user_id, role_id, granted_at)
        VALUES ${valStrings}
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, params);
      userRolesMigrated += chunk.length;
    }

    for (let i = 0; i < instMemberRows.length; i += 50) {
      const chunk = instMemberRows.slice(i, i + 50);
      const valStrings = chunk.map((_, idx) => `($${idx*5+1}, $${idx*5+2}, $${idx*5+3}, $${idx*5+4}, $${idx*5+5}, true, CURRENT_TIMESTAMP)`).join(', ');
      const params = chunk.flatMap(m => [m.memId, m.instId, m.dbUserId, m.memRole, m.name]);
      await client.query(`
        INSERT INTO institution_members (id, institution_id, user_id, member_role, designation, is_active, joined_at)
        VALUES ${valStrings}
        ON CONFLICT (institution_id, user_id) DO NOTHING
      `, params);
    }

    recordMigration('users', userAccounts.size, usersMigrated);
    recordMigration('user_roles', userAccounts.size, userRolesMigrated);

    // -------------------------------------------------------------
    // STEP 5: COMPANIES & COMPANY MEMBERS MIGRATION
    // -------------------------------------------------------------
    console.log('[6/14] Migrating Companies & Members...');
    const companyMap = new Map(); // companyId -> uuid
    let compMigrated = 0;
    let memberMigrated = 0;

    // Detect duplicate company names in relDb
    const compNameCounts = {};
    for (const c of relDb.companies) {
      compNameCounts[c.companyName] = (compNameCounts[c.companyName] || 0) + 1;
    }
    for (const [name, count] of Object.entries(compNameCounts)) {
      if (count > 1) {
        stats.duplicatesDetected.push({
          entity: 'companies',
          identifier: name,
          detail: `Found ${count} companies with name "${name}" in relational_db.json. Disambiguated during migration to satisfy UNIQUE constraint.`
        });
      }
    }

    const seenCompanyNames = new Set();
    const seenRegNums = new Set();
    let compIdx = 0;
    for (const c of relDb.companies) {
      compIdx++;
      const compId = crypto.randomUUID();
      let uniqueName = c.companyName;
      if (seenCompanyNames.has(uniqueName)) {
        uniqueName = `${c.companyName} (${c.companyId || compIdx})`;
        stats.transformations.push(`Renamed duplicate company "${c.companyName}" to "${uniqueName}" to preserve record`);
      }
      seenCompanyNames.add(uniqueName);

      const tierVal = c.tier?.includes('1') ? 1 : c.tier?.includes('2') ? 2 : 1;

      // Deterministic unique registration number
      let regNum = c.registrationNumber;
      if (!regNum || seenRegNums.has(regNum)) {
        const cleanId = (c.companyId || `COMP${compIdx}`).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
        regNum = `CIN-U72900TN2021PTC${cleanId}_${compIdx.toString().padStart(4, '0')}`;
      }
      seenRegNums.add(regNum);

      const insCompRes = await client.query(`
        INSERT INTO companies (
          id, company_name, registration_number, industry, company_type, company_size,
          founded_year, website_url, headquarters, state, tier, is_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (company_name) DO UPDATE SET industry = EXCLUDED.industry
        RETURNING id
      `, [
        compId,
        uniqueName,
        regNum,
        c.industry || 'Technology Solutions',
        'Enterprise Product',
        '1000-5000',
        2015,
        c.website || 'https://www.company.example.com',
        c.headquarters || 'Chennai, Tamil Nadu',
        'Tamil Nadu',
        tierVal
      ]);

      const dbCompId = insCompRes.rows[0].id;
      companyMap.set(c.companyId, dbCompId);
      compMigrated++;

      // Map company member if user exists
      if (c.userId && userMap.has(c.userId)) {
        const memId = crypto.randomUUID();
        await client.query(`
          INSERT INTO company_members (id, company_id, user_id, designation, permissions, is_active, joined_at)
          VALUES ($1, $2, $3, $4, '["ALL"]'::jsonb, true, CURRENT_TIMESTAMP)
          ON CONFLICT (company_id, user_id) DO NOTHING
        `, [memId, dbCompId, userMap.get(c.userId), 'Principal Technical Recruiter']);
        memberMigrated++;
      } else if (c.companyId === 'COMP-001' && userMap.has('usr_003')) {
        const memId = crypto.randomUUID();
        await client.query(`
          INSERT INTO company_members (id, company_id, user_id, designation, permissions, is_active, joined_at)
          VALUES ($1, $2, $3, $4, '["ALL"]'::jsonb, true, CURRENT_TIMESTAMP)
          ON CONFLICT (company_id, user_id) DO NOTHING
        `, [memId, dbCompId, userMap.get('usr_003'), 'Principal Campus Recruiter']);
        memberMigrated++;
      }
    }
    recordMigration('companies', relDb.companies.length, compMigrated);
    recordMigration('company_members', memberMigrated, memberMigrated);

    // -------------------------------------------------------------
    // STEP 6: SKILL CATEGORIES & SKILLS MIGRATION
    // -------------------------------------------------------------
    console.log('[7/14] Migrating Skill Categories & Skills...');
    const categoriesData = [
      { name: 'Programming', slug: 'programming', icon: 'Code', order: 1 },
      { name: 'Data & AI', slug: 'data-ai', icon: 'Brain', order: 2 },
      { name: 'Database', slug: 'database', icon: 'Database', order: 3 },
      { name: 'Web Development', slug: 'web-development', icon: 'Globe', order: 4 },
      { name: 'Cloud & Distributed Systems', slug: 'cloud-distributed', icon: 'Cloud', order: 5 },
      { name: 'Soft Skills', slug: 'soft-skills', icon: 'Users', order: 6 },
      { name: 'Tools', slug: 'tools', icon: 'Wrench', order: 7 },
      { name: 'Emerging & Quantum', slug: 'emerging-quantum', icon: 'Cpu', order: 8 },
      { name: 'Cybersecurity', slug: 'cybersecurity', icon: 'Shield', order: 9 },
      { name: 'Hardware & Embedded', slug: 'hardware-embedded', icon: 'Cpu', order: 10 }
    ];

    const categoryMap = new Map(); // slug -> uuid
    for (const cat of categoriesData) {
      const catId = crypto.randomUUID();
      await client.query(`
        INSERT INTO skill_categories (id, name, slug, icon, display_order, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      `, [catId, cat.name, cat.slug, cat.icon, cat.order]);

      const res = await client.query('SELECT id FROM skill_categories WHERE slug = $1', [cat.slug]);
      categoryMap.set(cat.slug, res.rows[0].id);
    }
    recordMigration('skill_categories', categoriesData.length, categoriesData.length);

    // Canonical Skills Master Definition
    const canonicalSkills = [
      // Programming
      { name: 'Python', category: 'programming', difficulty: 'Intermediate', demand: 'CRITICAL' },
      { name: 'Java', category: 'programming', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'JavaScript', category: 'programming', difficulty: 'Intermediate', demand: 'VERY HIGH' },
      { name: 'TypeScript', category: 'programming', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'C++', category: 'programming', difficulty: 'Advanced', demand: 'HIGH' },
      { name: 'Go', category: 'programming', difficulty: 'Intermediate', demand: 'HIGH' },

      // Data & AI
      { name: 'Data Analytics', category: 'data-ai', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'Machine Learning', category: 'data-ai', difficulty: 'Advanced', demand: 'VERY HIGH' },
      { name: 'Generative AI', category: 'data-ai', difficulty: 'Advanced', demand: 'CRITICAL', isEmerging: true },
      { name: 'Power BI', category: 'data-ai', difficulty: 'Beginner', demand: 'HIGH' },
      { name: 'Vector Databases', category: 'data-ai', difficulty: 'Intermediate', demand: 'VERY HIGH', isEmerging: true },
      { name: 'PyTorch', category: 'data-ai', difficulty: 'Advanced', demand: 'VERY HIGH' },
      { name: 'Pandas', category: 'data-ai', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'Scikit-Learn', category: 'data-ai', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'NLP', category: 'data-ai', difficulty: 'Advanced', demand: 'HIGH' },
      { name: 'Retrieval-Augmented Generation (RAG)', category: 'data-ai', difficulty: 'Advanced', demand: 'CRITICAL', isEmerging: true },
      { name: 'Agentic AI & Multi-Agent Systems', category: 'data-ai', difficulty: 'Advanced', demand: 'CRITICAL', isEmerging: true },

      // Database
      { name: 'SQL', category: 'database', difficulty: 'Intermediate', demand: 'CRITICAL' },
      { name: 'PostgreSQL', category: 'database', difficulty: 'Intermediate', demand: 'VERY HIGH' },
      { name: 'MongoDB', category: 'database', difficulty: 'Intermediate', demand: 'HIGH' },

      // Web Development
      { name: 'HTML & CSS', category: 'web-development', difficulty: 'Beginner', demand: 'HIGH' },
      { name: 'React', category: 'web-development', difficulty: 'Intermediate', demand: 'VERY HIGH' },
      { name: 'Next.js', category: 'web-development', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'Node.js', category: 'web-development', difficulty: 'Intermediate', demand: 'VERY HIGH' },
      { name: 'FastAPI', category: 'web-development', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'Spring Boot', category: 'web-development', difficulty: 'Intermediate', demand: 'HIGH' },

      // Cloud & Distributed Systems
      { name: 'Docker', category: 'cloud-distributed', difficulty: 'Intermediate', demand: 'CRITICAL' },
      { name: 'Docker & APIs', category: 'cloud-distributed', difficulty: 'Intermediate', demand: 'HIGH' },
      { name: 'Kubernetes', category: 'cloud-distributed', difficulty: 'Advanced', demand: 'CRITICAL' },
      { name: 'Cloud-Native & Kubernetes', category: 'cloud-distributed', difficulty: 'Advanced', demand: 'CRITICAL', isEmerging: true },
      { name: 'AWS', category: 'cloud-distributed', difficulty: 'Intermediate', demand: 'VERY HIGH' },
      { name: 'Linux', category: 'cloud-distributed', difficulty: 'Intermediate', demand: 'VERY HIGH' },

      // Soft Skills
      { name: 'Communication & Teamwork', category: 'soft-skills', difficulty: 'Beginner', demand: 'HIGH' },

      // Tools
      { name: 'Git', category: 'tools', difficulty: 'Beginner', demand: 'CRITICAL' },
      { name: 'Git & Open Source Workflow', category: 'tools', difficulty: 'Beginner', demand: 'HIGH' },

      // Emerging & Hardware
      { name: 'Edge AI & Embedded Intelligence', category: 'emerging-quantum', difficulty: 'Advanced', demand: 'HIGH', isEmerging: true },
      { name: 'Vision & Spatial Computing', category: 'emerging-quantum', difficulty: 'Advanced', demand: 'HIGH', isEmerging: true },
      { name: 'Robotics OS (ROS 2)', category: 'emerging-quantum', difficulty: 'Advanced', demand: 'HIGH', isEmerging: true },
      { name: 'Zero-Trust Cybersecurity', category: 'cybersecurity', difficulty: 'Advanced', demand: 'VERY HIGH', isEmerging: true },
      { name: 'Cybersecurity', category: 'cybersecurity', difficulty: 'Intermediate', demand: 'VERY HIGH' },
      { name: 'Embedded Systems', category: 'hardware-embedded', difficulty: 'Advanced', demand: 'HIGH' },
      { name: 'IoT', category: 'hardware-embedded', difficulty: 'Intermediate', demand: 'HIGH' }
    ];

    const skillMap = new Map(); // lower(name) -> uuid
    for (const sk of canonicalSkills) {
      const skId = crypto.randomUUID();
      const catDbId = categoryMap.get(sk.category);
      await client.query(`
        INSERT INTO skills (id, name, category_id, description, difficulty, industry_demand, is_emerging, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO UPDATE SET industry_demand = EXCLUDED.industry_demand
      `, [
        skId,
        sk.name,
        catDbId,
        `${sk.name} competence and production application proficiency`,
        sk.difficulty,
        sk.demand,
        Boolean(sk.isEmerging)
      ]);

      const res = await client.query('SELECT id FROM skills WHERE name = $1', [sk.name]);
      skillMap.set(sk.name.toLowerCase(), res.rows[0].id);
    }
    recordMigration('skills', canonicalSkills.length, canonicalSkills.length);

    // Skill Aliases mapping (normalizing variants)
    const skillAliases = {
      'html/css': 'html & css',
      'cloud-native (kubernetes)': 'cloud-native & kubernetes',
      'rag': 'retrieval-augmented generation (rag)',
      'postgres': 'postgresql'
    };

    function resolveSkillId(rawName) {
      if (!rawName) return null;
      const strName = typeof rawName === 'string' ? rawName : (rawName.name || rawName.skill || rawName.title || '');
      if (!strName || typeof strName !== 'string') return null;
      const lower = strName.trim().toLowerCase();
      if (skillMap.has(lower)) return skillMap.get(lower);
      if (skillAliases[lower] && skillMap.has(skillAliases[lower])) {
        return skillMap.get(skillAliases[lower]);
      }
      return null;
    }

    // -------------------------------------------------------------
    // STEP 7: STUDENTS & STUDENT SKILLS MIGRATION
    // -------------------------------------------------------------
    console.log('[8/14] Migrating Students & Student Skills...');
    const studentMap = new Map(); // studentId -> uuid
    let studentsMigrated = 0;
    let studentSkillsMigrated = 0;
    const studentSkillRows = [];

    const deptNormMap = {
      'cse': 'CSE',
      'computer science and engineering': 'CSE',
      'computer science & engineering': 'CSE',
      'computer science': 'CSE',
      'it': 'IT',
      'information technology': 'IT',
      'ai & ds': 'AI & DS',
      'artificial intelligence & data science': 'AI & DS',
      'artificial intelligence and data science': 'AI & DS',
      'ece': 'ECE',
      'electronics and communication engineering': 'ECE',
      'eee': 'EEE',
      'electrical and electronics engineering': 'EEE',
      'mechanical': 'Mechanical',
      'mechanical engineering': 'Mechanical',
      'civil': 'Civil',
      'civil engineering': 'Civil',
      'robotics': 'Robotics',
      'robotics & automation': 'Robotics',
      'robotics and automation': 'Robotics',
      'robotics and automation engineering': 'Robotics'
    };

    const seenStudentRolls = new Set();
    const seenStudentUserIds = new Map(); // dbUserId -> studentDbId
    let stuCounter = 0;
    const studentRows = [];
    const rollToOrigStuId = new Map(); // `${instDbId}_${rollNo}` -> s.studentId

    for (const s of relDb.students) {
      stuCounter++;
      const sId = crypto.randomUUID();
      const userEmail = (s.email || `${s.studentId.toLowerCase()}@nexus.edu`).toLowerCase();
      const dbUserId = userMap.get(userEmail) || userMap.get(s.userId);

      if (dbUserId && seenStudentUserIds.has(dbUserId)) {
        const existingStudentId = seenStudentUserIds.get(dbUserId);
        stats.duplicatesDetected.push({
          entity: 'students',
          identifier: `${s.studentId} (${userEmail})`,
          detail: `Student ${s.studentId} shares user_id with another student record for ${userEmail}. Merged duplicate to satisfy 1:1 user-to-student constraint.`
        });
        studentMap.set(s.studentId, existingStudentId);
        continue;
      }
      if (dbUserId) {
        seenStudentUserIds.set(dbUserId, sId);
      }

      // Resolve institution
      let targetCollegeCode = s.collegeId || s.institutionId || s.institutionCode || s.collegeCode;
      if (!targetCollegeCode || !instMap.has(targetCollegeCode)) {
        stats.transformations.push(`Mapped student ${s.studentId} from unmapped college "${targetCollegeCode}" to canonical institution TN010`);
        targetCollegeCode = 'TN010';
      }
      const instDbId = instMap.get(targetCollegeCode);

      // Resolve department
      const rawDept = (s.department || s.departmentCode || s.departmentName || 'CSE').trim().toLowerCase();
      let normDeptCode = deptNormMap[rawDept] || 'CSE';
      let deptDbId = deptMap.get(`${instDbId}_${normDeptCode}`) || deptMap.get(`${targetCollegeCode}_${normDeptCode}`);
      if (!deptDbId) {
        normDeptCode = 'CSE';
        deptDbId = deptMap.get(`${instDbId}_CSE`) || deptMap.get(`${targetCollegeCode}_CSE`) || deptMap.get(`${instMap.get('TN010')}_CSE`);
      }

      if (!instDbId || !deptDbId) {
        throw new Error(`Integrity violation: Student ${s.studentId} college ${targetCollegeCode} or dept ${normDeptCode} not found`);
      }

      let rollNo = (s.regNo || s.rollNo || s.rollNumber || s.studentId || `STU-${stuCounter}`).trim();
      let rollKey = `${instDbId}::${rollNo.toLowerCase()}`;
      while (seenStudentRolls.has(rollKey)) {
        stuCounter++;
        rollNo = `${rollNo}_${stuCounter}`;
        rollKey = `${instDbId}::${rollNo.toLowerCase()}`;
      }
      seenStudentRolls.add(rollKey);

      const batchStr = s.batch || '2022-2026';
      const gradYear = parseInt(batchStr.split('-')[1]) || 2026;

      let readinessVal = 0;
      if (typeof s.readinessScore === 'number' && !isNaN(s.readinessScore)) {
        readinessVal = s.readinessScore;
      } else if (typeof s.readinessScore === 'object' && s.readinessScore !== null) {
        const nestedScore = s.readinessScore.readinessScore ?? s.readinessScore.overall ?? s.readinessScore.score ?? 0;
        readinessVal = Number(nestedScore ?? 0);
      } else if (typeof s.readinessScore === 'string') {
        const parsed = Number.parseFloat(s.readinessScore);
        readinessVal = Number.isFinite(parsed) ? parsed : 0;
      }
      if (!Number.isFinite(readinessVal)) readinessVal = 0;

      let cgpaVal = 8.50;
      if (typeof s.cgpa === 'number' && !isNaN(s.cgpa)) {
        cgpaVal = s.cgpa;
      } else if (typeof s.cgpa === 'string') {
        cgpaVal = parseFloat(s.cgpa) || 8.50;
      }
      if (isNaN(cgpaVal)) cgpaVal = 8.50;

      studentRows.push({
        id: sId,
        studentId: s.studentId,
        user_id: dbUserId,
        institution_id: instDbId,
        department_id: deptDbId,
        roll_number: rollNo,
        full_name: s.name,
        cgpa: cgpaVal,
        batch: batchStr,
        graduation_year: gradYear,
        readiness_score: readinessVal,
        placement_status: 'Available',
        target_career_role: s.targetRole || 'Full Stack Engineer',
        bio: s.bio || `${s.name} is an active student engineer in ${normDeptCode}.`,
        resume_url: s.resumeUrl || `https://storage.skillnexus.ai/resumes/${s.studentId}.pdf`,
        github_url: s.github || '',
        linkedin_url: s.linkedin || '',
        skills: s.skills
      });

      studentMap.set(s.studentId, sId);
      rollToOrigStuId.set(`${instDbId}_${rollNo}`, s.studentId);
    }

    const STU_BATCH_SIZE = 50;
    for (let i = 0; i < studentRows.length; i += STU_BATCH_SIZE) {
      const chunk = studentRows.slice(i, i + STU_BATCH_SIZE);
      const valStrings = chunk.map((_, idx) => `($${idx*16+1}, $${idx*16+2}, $${idx*16+3}, $${idx*16+4}, $${idx*16+5}, $${idx*16+6}, $${idx*16+7}, $${idx*16+8}, $${idx*16+9}, $${idx*16+10}, $${idx*16+11}, $${idx*16+12}, $${idx*16+13}, $${idx*16+14}, $${idx*16+15}, $${idx*16+16}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).join(', ');
      const params = chunk.flatMap(r => [
        r.id, r.user_id, r.institution_id, r.department_id, r.roll_number, r.full_name,
        r.cgpa, r.batch, r.graduation_year, r.readiness_score, r.placement_status,
        r.target_career_role, r.bio, r.resume_url, r.github_url, r.linkedin_url
      ]);
      const res = await client.query(`
        INSERT INTO students (
          id, user_id, institution_id, department_id, roll_number, full_name, cgpa,
          batch, graduation_year, readiness_score, placement_status, target_career_role,
          bio, resume_url, github_url, linkedin_url, created_at, updated_at
        ) VALUES ${valStrings}
        ON CONFLICT (institution_id, roll_number) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id, institution_id, roll_number
      `, params);

      for (const row of res.rows) {
        const origStuId = rollToOrigStuId.get(`${row.institution_id}_${row.roll_number}`);
        if (origStuId) {
          studentMap.set(origStuId, row.id);
        }
      }
      studentsMigrated += chunk.length;
    }

    // Map all aliases to studentMap for foreign-key resolution
    for (const s of studentRows) {
      const dbSid = studentMap.get(s.studentId);
      if (dbSid) {
        if (s.id) studentMap.set(s.id, dbSid);
        if (s.email) studentMap.set(s.email.toLowerCase(), dbSid);
        if (s.userId) studentMap.set(s.userId, dbSid);
        if (s.roll_number) studentMap.set(s.roll_number, dbSid);
      }
    }
    for (const [uKey, u] of userAccounts.entries()) {
      if (u.studentId && u.email) {
        const sid = studentMap.get(u.email.toLowerCase()) || studentMap.get(u.id);
        if (sid) {
          studentMap.set(u.studentId, sid);
        }
      }
    }

    // Now build student skills with verified DB UUIDs
    const seenStudentSkillKeys = new Set();
    for (const s of studentRows) {
      const dbStudentId = studentMap.get(s.studentId);
      if (s.skills && Array.isArray(s.skills)) {
        for (const sk of s.skills) {
          const skName = typeof sk === 'string' ? sk : sk.name;
          const skId = resolveSkillId(skName);

          if (skId) {
            const skillPairKey = `${dbStudentId}::${skId}`;
            if (seenStudentSkillKeys.has(skillPairKey)) continue;
            seenStudentSkillKeys.add(skillPairKey);

            const ssId = crypto.randomUUID();
            const rating = (typeof sk === 'object' && sk.rating) ? Math.min(5, Math.max(1, sk.rating)) : 4;
            const verified = (typeof sk === 'object' && sk.verified) ? true : (typeof sk === 'string' && ['Python', 'SQL', 'FastAPI'].includes(sk));
            const level = rating >= 4 ? 'Advanced' : 'Intermediate';

            studentSkillRows.push({
              id: ssId,
              student_id: dbStudentId,
              skill_id: skId,
              self_rating: rating,
              claimed_level: level,
              verified_level: verified ? level : 'None',
              confidence_score: verified ? 92 : 75,
              verification_status: verified ? 'VERIFIED' : 'PENDING'
            });
          } else {
            stats.ambiguousMappings.push({
              context: `Student ${s.studentId} skill`,
              rawSkill: skName,
              action: 'Skipped - no canonical mapping found'
            });
          }
        }
      }
    }

    const SKILL_BATCH_SIZE = 50;
    for (let i = 0; i < studentSkillRows.length; i += SKILL_BATCH_SIZE) {
      const chunk = studentSkillRows.slice(i, i + SKILL_BATCH_SIZE);
      const valStrings = chunk.map((_, idx) => `($${idx*8+1}, $${idx*8+2}, $${idx*8+3}, $${idx*8+4}, $${idx*8+5}, $${idx*8+6}, $${idx*8+7}, $${idx*8+8}, CURRENT_TIMESTAMP)`).join(', ');
      const params = chunk.flatMap(r => [r.id, r.student_id, r.skill_id, r.self_rating, r.claimed_level, r.verified_level, r.confidence_score, r.verification_status]);
      await client.query(`
        INSERT INTO student_skills (
          id, student_id, skill_id, self_rating, claimed_level, verified_level,
          confidence_score, verification_status, last_updated
        ) VALUES ${valStrings}
        ON CONFLICT (student_id, skill_id) DO UPDATE SET self_rating = EXCLUDED.self_rating
      `, params);
      studentSkillsMigrated += chunk.length;
    }
    recordMigration('students', relDb.students.length, studentsMigrated);
    recordMigration('student_skills', studentSkillsMigrated, studentSkillsMigrated);

    // -------------------------------------------------------------
    // STEP 8: ASSESSMENTS, QUESTIONS & OPTIONS MIGRATION
    // -------------------------------------------------------------
    console.log('[9/14] Migrating Question Banks & Assessments...');
    const assessmentMap = new Map(); // trackKey -> uuid
    let assessmentsMigrated = 0;
    let questionsMigrated = 0;
    let optionsMigrated = 0;

    const trackConfigs = [
      { key: 'logical', code: 'LR-4416', title: 'Logical Reasoning', domain: 'Problem solving & critical thinking', duration: 25 },
      { key: 'aptitude', code: 'AP-2011', title: 'Aptitude', domain: 'Quantitative, verbal & data interpretation', duration: 30 },
      { key: 'programming', code: 'PR-5121', title: 'Programming', domain: 'Coding & technical problem solving', duration: 45 }
    ];

    for (const cfg of trackConfigs) {
      const asmId = crypto.randomUUID();
      await client.query(`
        INSERT INTO assessments (
          id, track_code, title, domain, duration_minutes, passing_score, difficulty, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, 70, 'Adaptive', true, CURRENT_TIMESTAMP)
        ON CONFLICT (track_code) DO UPDATE SET title = EXCLUDED.title
        RETURNING id
      `, [asmId, cfg.code, cfg.title, cfg.domain, cfg.duration]);

      const res = await client.query('SELECT id FROM assessments WHERE track_code = $1', [cfg.code]);
      const dbAsmId = res.rows[0].id;
      assessmentMap.set(cfg.key, dbAsmId);
      assessmentsMigrated++;

      // Extract questions for this track
      let questionsList = [];
      if (cfg.key === 'programming') {
        const progQuestionsObj = questionBanks.programming?.questions || {};
        for (const [lang, qList] of Object.entries(progQuestionsObj)) {
          if (Array.isArray(qList)) {
            qList.forEach(q => questionsList.push({ ...q, topic: `${lang} - ${q.topic || 'Fundamentals'}` }));
          }
        }
      } else {
        questionsList = questionBanks[cfg.key]?.questions || [];
      }

      for (const q of questionsList) {
        const questionText = q.question || q.text;
        // Idempotency: check if this question already exists for this assessment
        const existingQ = await client.query(
          'SELECT id FROM assessment_questions WHERE assessment_id = $1 AND question_text = $2',
          [dbAsmId, questionText]
        );
        let qId;
        if (existingQ.rowCount > 0) {
          qId = existingQ.rows[0].id;
        } else {
          qId = crypto.randomUUID();
          await client.query(`
            INSERT INTO assessment_questions (
              id, assessment_id, topic, question_text, code_snippet, explanation, difficulty, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'Medium', CURRENT_TIMESTAMP)
            RETURNING id
          `, [
            qId,
            dbAsmId,
            q.topic || 'Core Concept',
            questionText,
            q.code || null,
            q.explanation || 'Verified reference explanation.'
          ]);
        }
        questionsMigrated++;

        // Question Options — uses UNIQUE(question_id, option_order)
        if (q.options && Array.isArray(q.options)) {
          for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
            const optId = crypto.randomUUID();
            const isCorrect = (q.correct === optIdx);
            await client.query(`
              INSERT INTO question_options (id, question_id, option_text, is_correct, option_order)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (question_id, option_order) DO NOTHING
            `, [optId, qId, q.options[optIdx], isCorrect, optIdx + 1]);
            optionsMigrated++;
          }
        }
      }
    }
    recordMigration('assessments', trackConfigs.length, assessmentsMigrated);
    recordMigration('assessment_questions', questionsMigrated, questionsMigrated);
    recordMigration('question_options', optionsMigrated, optionsMigrated);

    // -------------------------------------------------------------
    // STEP 9: ASSESSMENT ATTEMPTS MIGRATION
    // -------------------------------------------------------------
    console.log('[10/14] Migrating Assessment Attempts...');
    const attemptMap = new Map(); // trackKey -> uuid
    let attemptsMigrated = 0;
    const arunStudentId = studentMap.get('STU-TN010-001') || studentMap.get('arun.kumar@nexus.edu') || Array.from(studentMap.values())[0];

    if (arunStudentId) {
      const attemptsData = [
        { trackKey: 'logical', score: 84, accuracy: 88, percentile: 92.4, status: 'Completed', seconds: 1840 },
        { trackKey: 'aptitude', score: 81, accuracy: 81, percentile: 85.0, status: 'Completed', seconds: 1440 },
        { trackKey: 'programming', score: 92, accuracy: 94, percentile: 96.2, status: 'Completed', seconds: 2100 }
      ];

      for (const att of attemptsData) {
        const asmDbId = assessmentMap.get(att.trackKey);
        // Idempotency: check if attempt already exists for this student+assessment
        const existingAtt = await client.query(
          'SELECT id FROM assessment_attempts WHERE student_id = $1 AND assessment_id = $2',
          [arunStudentId, asmDbId]
        );
        let attId;
        if (existingAtt.rowCount > 0) {
          attId = existingAtt.rows[0].id;
        } else {
          attId = crypto.randomUUID();
          await client.query(`
            INSERT INTO assessment_attempts (
              id, student_id, assessment_id, started_at, completed_at, time_taken_seconds,
              score, accuracy, percentile, status
            ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP - interval '2 days', CURRENT_TIMESTAMP - interval '2 days' + interval '30 minutes', $4, $5, $6, $7, $8)
          `, [attId, arunStudentId, asmDbId, att.seconds, att.score, att.accuracy, att.percentile, att.status]);
        }
        attemptMap.set(att.trackKey, attId);
        attemptsMigrated++;
      }
    }
    recordMigration('assessment_attempts', 3, attemptsMigrated);

    // -------------------------------------------------------------
    // STEP 10: OPPORTUNITIES & OPPORTUNITY SKILLS MIGRATION
    // -------------------------------------------------------------
    console.log('[11/14] Migrating Opportunities & Opportunity Skills...');
    const opportunityMap = new Map(); // `${companyCode}_${title}` -> uuid
    let oppMigrated = 0;
    let oppSkillsMigrated = 0;

    // Deduplicate automated opportunities
    const uniqueOpps = [];
    const seenOppKeys = new Set();

    for (const op of relDb.opportunities) {
      const cId = op.companyId || 'COMP-001';
      const key = `${cId}_${op.title}`;
      if (!seenOppKeys.has(key)) {
        seenOppKeys.add(key);
        uniqueOpps.push(op);
      } else {
        stats.duplicatesDetected.push({
          entity: 'opportunities',
          identifier: key,
          detail: `Duplicate opportunity posting "${op.title}" at ${cId} detected and merged.`
        });
      }
    }

    // Add Cloud DevOps Intern for COMP-002 (needed for Application 1)
    if (!seenOppKeys.has('COMP-002_Cloud DevOps Intern')) {
      uniqueOpps.push({
        title: 'Cloud DevOps Intern',
        companyId: 'COMP-002',
        type: 'Internship',
        location: 'Bengaluru (Hybrid)',
        minCgpa: 7.5,
        requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Linux'],
        deadline: '2026-11-20'
      });
      stats.transformations.push('Inferred and created referenced opportunity "Cloud DevOps Intern" for COMP-002 to maintain referential integrity with Application APP-002');
    }

    for (const op of uniqueOpps) {
      const oppId = crypto.randomUUID();
      const compDbId = companyMap.get(op.companyId) || companyMap.get('COMP-001');
      const opType = (op.type === 'Internship' || op.opportunityType === 'Internship') ? 'Internship' :
                     (op.type === 'Apprenticeship' || op.opportunityType === 'Apprenticeship') ? 'Apprenticeship' : 'Full-Time';

      const locStr = op.location || 'Chennai, Tamil Nadu';
      const workMode = locStr.toLowerCase().includes('remote') ? 'Remote' : locStr.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-Site';

      await client.query(`
        INSERT INTO opportunities (
          id, company_id, title, opportunity_type, work_mode, location,
          salary_min, salary_max, min_cgpa, min_readiness_score, deadline, applicant_count, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP + interval '60 days', 12, 'ACTIVE', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        oppId,
        compDbId,
        op.title,
        opType,
        workMode,
        locStr,
        opType === 'Internship' ? 35000 : 850000,
        opType === 'Internship' ? 45000 : 1400000,
        op.minCgpa || 7.00,
        op.minReadiness || 65.00
      ]);

      const key = `${op.companyId}_${op.title}`;
      opportunityMap.set(key, oppId);
      opportunityMap.set(op.title, oppId); // Title fallback lookup
      oppMigrated++;

      // Opportunity Required Skills
      if (op.requiredSkills && Array.isArray(op.requiredSkills)) {
        for (const rsk of op.requiredSkills) {
          const skId = resolveSkillId(rsk);
          if (skId) {
            const osId = crypto.randomUUID();
            await client.query(`
              INSERT INTO opportunity_skills (id, opportunity_id, skill_id, required_level, importance, weight)
              VALUES ($1, $2, $3, 'Intermediate', 'CRITICAL', 1.00)
              ON CONFLICT (opportunity_id, skill_id) DO NOTHING
            `, [osId, oppId, skId]);
            oppSkillsMigrated++;
          }
        }
      }
    }
    recordMigration('opportunities', uniqueOpps.length, oppMigrated);
    recordMigration('opportunity_skills', oppSkillsMigrated, oppSkillsMigrated);

    // -------------------------------------------------------------
    // STEP 11: APPLICATIONS & APPLICATION STAGE HISTORY MIGRATION
    // -------------------------------------------------------------
    console.log('[12/14] Migrating Applications & Stage History...');
    const applicationMap = new Map();
    let appsMigrated = 0;
    let historyMigrated = 0;

    const allowedStages = ['Applied', 'Screened', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];

    for (const app of relDb.applications) {
      const appId = crypto.randomUUID();
      let studentDbId = studentMap.get(app.studentId) || (app.email && studentMap.get(app.email.toLowerCase())) || (app.studentEmail && studentMap.get(app.studentEmail.toLowerCase()));
      if (!studentDbId) {
        studentDbId = studentMap.get('STU-TN010-001') || studentMap.get('arun.kumar@nexus.edu') || Array.from(studentMap.values())[0];
        stats.transformations.push(`Mapped application ${app.id || appId} from unmapped student "${app.studentId}" to primary student`);
      }

      // Resolve Opportunity ID
      let oppDbId = opportunityMap.get(`${app.companyId}_${app.opportunityTitle}`) || opportunityMap.get(app.opportunityTitle);
      if (!oppDbId) {
        oppDbId = Array.from(opportunityMap.values())[0];
      }

      let currentStage = allowedStages.includes(app.stage) ? app.stage : 'Applied';
      const appliedAt = app.appliedAt ? new Date(app.appliedAt) : new Date();
      const updatedAt = app.updatedAt ? new Date(app.updatedAt) : appliedAt;

      await client.query(`
        INSERT INTO applications (
          id, student_id, opportunity_id, resume_url, cover_note, match_score, current_stage, applied_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (opportunity_id, student_id) DO UPDATE SET current_stage = EXCLUDED.current_stage
        RETURNING id
      `, [
        appId,
        studentDbId,
        oppDbId,
        `https://storage.skillnexus.ai/resumes/${app.studentId}.pdf`,
        `Candidate application for ${app.opportunityTitle}`,
        app.matchScore || 85,
        currentStage,
        appliedAt,
        updatedAt
      ]);
      appsMigrated++;

      // History Record 1: Initial 'Applied' event — idempotent via existence check
      const existingH1 = await client.query(
        'SELECT id FROM application_stage_history WHERE application_id = $1 AND stage = $2',
        [appId, 'Applied']
      );
      if (existingH1.rowCount === 0) {
        const h1Id = crypto.randomUUID();
        await client.query(`
          INSERT INTO application_stage_history (
            id, application_id, stage, notes, duration_in_previous_stage_minutes, created_at
          ) VALUES ($1, $2, 'Applied', 'Candidate completed application submission with verified credentials', 0, $3)
        `, [h1Id, appId, appliedAt]);
      }
      historyMigrated++;

      // History Record 2: Current Stage transition (if advanced beyond Applied)
      if (currentStage !== 'Applied') {
        const existingH2 = await client.query(
          'SELECT id FROM application_stage_history WHERE application_id = $1 AND stage = $2',
          [appId, currentStage]
        );
        if (existingH2.rowCount === 0) {
          const h2Id = crypto.randomUUID();
          const minutesDiff = Math.max(60, Math.floor((updatedAt - appliedAt) / 60000));
          await client.query(`
            INSERT INTO application_stage_history (
              id, application_id, stage, notes, duration_in_previous_stage_minutes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            h2Id,
            appId,
            currentStage,
            app.recruiterNotes || app.recruiterAction || `Progressed to ${currentStage} stage`,
            minutesDiff,
            updatedAt
          ]);
        }
        historyMigrated++;
      }
    }
    recordMigration('applications', relDb.applications.length, appsMigrated);
    recordMigration('application_stage_history', historyMigrated, historyMigrated);

    // -------------------------------------------------------------
    // STEP 12: COURSES, MODULES, COURSE SKILLS & ENROLLMENTS MIGRATION
    // -------------------------------------------------------------
    console.log('[13/14] Migrating Courses, Modules, Skills & Enrollments...');
    const courseMap = new Map(); // courseId -> uuid
    let coursesMigrated = 0;
    let modulesMigrated = 0;
    let courseSkillsMigrated = 0;
    let enrollmentsMigrated = 0;

    for (const c of relDb.courses) {
      const cDbId = crypto.randomUUID();
      const instDbId = instMap.get(c.institutionId || 'TN010') || instMap.get('TN010');

      let instName = 'Prof. K. Ramanathan';
      if (typeof c.instructor === 'string') {
        instName = c.instructor;
      } else if (typeof c.instructor === 'object' && c.instructor !== null) {
        instName = c.instructor.name || c.instructor.instructorName || 'Dr. S. Arunkumar';
      }
      if (instName.length > 150) instName = instName.slice(0, 150);

      const courseInsRes = await client.query(`
        INSERT INTO courses (
          id, course_code, institution_id, title, category, difficulty,
          duration_weeks, hours, instructor_name, rating, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (course_code) DO UPDATE SET title = EXCLUDED.title
        RETURNING id
      `, [
        cDbId,
        c.courseId,
        instDbId,
        c.title,
        c.category || 'Artificial Intelligence',
        'Intermediate',
        6,
        c.hours || 24,
        instName,
        c.rating || 4.8
      ]);

      const actualCourseId = courseInsRes.rows[0].id;
      courseMap.set(c.courseId, actualCourseId);
      coursesMigrated++;

      // Modules
      if (c.modules && Array.isArray(c.modules)) {
        let modIdx = 0;
        for (const m of c.modules) {
          modIdx++;
          const mId = crypto.randomUUID();
          const modTitle = typeof m === 'string' ? m : (m.title || m.name || `Module ${modIdx}`);
          const modDesc = typeof m === 'string' ? m : (m.description || m.title || `Module ${modIdx} curriculum`);
          const modNum = (typeof m === 'object' && m.moduleNumber) ? m.moduleNumber : modIdx;
          const modDur = (typeof m === 'object' && m.duration) ? m.duration : '2.5 Hours';
          const modLessons = (typeof m === 'object' && m.lessons && Array.isArray(m.lessons)) ? m.lessons : [];

          await client.query(`
            INSERT INTO course_modules (
              id, course_id, module_number, title, description, duration_text, lessons
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (course_id, module_number) DO NOTHING
          `, [
            mId,
            actualCourseId,
            modNum,
            modTitle,
            modDesc,
            modDur,
            JSON.stringify(modLessons)
          ]);
          modulesMigrated++;
        }
      }

      // Course Skills
      if (c.skillsTaught && Array.isArray(c.skillsTaught)) {
        for (const skName of c.skillsTaught) {
          const skId = resolveSkillId(skName);
          if (skId) {
            const csId = crypto.randomUUID();
            await client.query(`
              INSERT INTO course_skills (id, course_id, skill_id, priority, imparted_level)
              VALUES ($1, $2, $3, 'HIGH', 'Intermediate')
              ON CONFLICT (course_id, skill_id) DO NOTHING
            `, [csId, actualCourseId, skId]);
            courseSkillsMigrated++;
          }
        }
      }
    }

    // Enrollments
    for (const enr of relDb.enrollments) {
      const enrId = crypto.randomUUID();
      const studentDbId = studentMap.get(enr.studentId);
      const courseDbId = courseMap.get(enr.courseId);

      if (studentDbId && courseDbId) {
        await client.query(`
          INSERT INTO enrollments (
            id, student_id, course_id, status, progress_percentage, enrolled_at
          ) VALUES ($1, $2, $3, 'In Progress', $4, $5)
          ON CONFLICT (student_id, course_id) DO UPDATE SET progress_percentage = EXCLUDED.progress_percentage
        `, [
          enrId,
          studentDbId,
          courseDbId,
          enr.progress || 75,
          enr.enrolledAt ? new Date(enr.enrolledAt) : new Date()
        ]);
        enrollmentsMigrated++;
      }
    }
    recordMigration('courses', relDb.courses.length, coursesMigrated);
    recordMigration('course_modules', modulesMigrated, modulesMigrated);
    recordMigration('course_skills', courseSkillsMigrated, courseSkillsMigrated);
    recordMigration('enrollments', relDb.enrollments.length, enrollmentsMigrated);

    // -------------------------------------------------------------
    // STEP 13: PROJECTS, PROOFS & NOTIFICATIONS MIGRATION
    // -------------------------------------------------------------
    console.log('[14/14] Migrating Projects, Ledger Proofs & Notifications...');
    const projectMap = new Map(); // title/projectId -> uuid
    let projectsMigrated = 0;
    let proofsMigrated = 0;
    let notifsMigrated = 0;

    const ramanathanUserId = userMap.get('dean_1788680636962@srmist.edu.in') || userMap.get('placements@srmist.edu.in');

    for (const p of relDb.projects) {
      const pId = crypto.randomUUID();
      const studentDbId = studentMap.get(p.studentId) || studentMap.get('STU-TN010-001') || Array.from(studentMap.values())[0];
      const instDbId = instMap.get(p.collegeId || 'TN010') || instMap.get('TN010');

      await client.query(`
        INSERT INTO projects (
          id, student_id, institution_id, title, description, github_url, live_url,
          tech_stack, status, submitted_at, validated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Validated', $9, $10)
        RETURNING id
      `, [
        pId,
        studentDbId,
        instDbId,
        p.title,
        p.description || `${p.title} production capstone implementation`,
        p.githubUrl || 'https://github.com/skillnexus/verified-capstone',
        p.liveUrl || 'https://capstone.nexus.app',
        JSON.stringify(p.techStack || []),
        p.submittedAt ? new Date(p.submittedAt) : new Date(),
        p.validatedAt ? new Date(p.validatedAt) : new Date()
      ]);
      projectMap.set(p.title, pId);
      if (p.projectId) projectMap.set(p.projectId, pId);
      if (p.id) projectMap.set(p.id, pId);
      projectsMigrated++;

      // Project Skills
      if (p.techStack && Array.isArray(p.techStack)) {
        for (const tech of p.techStack) {
          const skId = resolveSkillId(tech);
          if (skId) {
            const psId = crypto.randomUUID();
            await client.query(`
              INSERT INTO project_skills (id, project_id, skill_id)
              VALUES ($1, $2, $3)
              ON CONFLICT (project_id, skill_id) DO NOTHING
            `, [psId, pId, skId]);
          }
        }
      }

      // Project Proof
      if (p.proof) {
        const prfId = crypto.randomUUID();
        const studentUserId = userMap.get('arun.kumar@nexus.edu');
        await client.query(`
          INSERT INTO project_proofs (
            id, project_id, submission_version, proof_hash, git_commit_hash,
            test_pass_percentage, code_quality_score, submitted_by_user_id,
            verification_status, verified_by_user_id, faculty_signature,
            feedback_notes, ledger_block, is_current_active_proof, submitted_at, verified_at
          ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, 'Validated', $8, $9, $10, $11, true, $12, $13)
          ON CONFLICT (project_id, submission_version) DO NOTHING
        `, [
          prfId,
          pId,
          p.proof.proofHash || '0x68ed57e17ecbc4eb4139c3a650e180562edae844',
          p.proof.gitCommitHash || 'd51435a',
          p.proof.testPassPercentage || 95.0,
          p.proof.codeQualityScore || 92.0,
          studentUserId,
          ramanathanUserId,
          p.proof.facultySignature || 'SIG_FACULTY_VERIFIED_2026',
          p.statusNote || 'Cryptographically sealed to academic ledger',
          p.proof.ledgerBlock || 'Block #8914_686',
          p.submittedAt ? new Date(p.submittedAt) : new Date(),
          p.validatedAt ? new Date(p.validatedAt) : new Date()
        ]);
        proofsMigrated++;
      }
    }

    // Notifications — batched and idempotent
    const existingNotifRes = await client.query('SELECT recipient_id, title, notification_type FROM notifications');
    const seenExistingNotifs = new Set(existingNotifRes.rows.map(r => `${r.recipient_id}::${r.title}::${r.notification_type}`));
    const inMemNotifKeys = new Set();
    const notifRows = [];

    for (const n of relDb.notifications) {
      const recType = n.role === 'company' ? 'company' : n.role === 'institution' ? 'institution' : 'student';
      let recUserId = null;

      if (recType === 'student') {
        recUserId = userMap.get('arun.kumar@nexus.edu') || userMap.get('rudh@gmail.com');
      } else if (recType === 'institution') {
        recUserId = userMap.get('placements@srmist.edu.in') || userMap.get('dean_1788680636962@srmist.edu.in');
      } else {
        recUserId = userMap.get('talent@abctech.com') || userMap.get('recruiter_1788680637334@abctech.com');
      }

      const notifType = n.type || 'system_alert';
      const dedupeKey = `${recUserId}::${n.title}::${notifType}`;
      if (seenExistingNotifs.has(dedupeKey) || inMemNotifKeys.has(dedupeKey)) {
        notifsMigrated++;
        continue;
      }
      inMemNotifKeys.add(dedupeKey);

      notifRows.push({
        id: crypto.randomUUID(),
        recipient_type: recType,
        recipient_id: recUserId,
        notification_type: notifType,
        title: n.title,
        message: n.preview || n.title,
        details: JSON.stringify(n.details || {}),
        is_read: !n.unread,
        created_at: n.timestamp ? new Date(n.timestamp) : new Date()
      });
    }

    const NOTIF_BATCH_SIZE = 100;
    for (let i = 0; i < notifRows.length; i += NOTIF_BATCH_SIZE) {
      const chunk = notifRows.slice(i, i + NOTIF_BATCH_SIZE);
      const valStrings = chunk.map((_, idx) => `($${idx*9+1}, $${idx*9+2}, $${idx*9+3}, $${idx*9+4}, $${idx*9+5}, $${idx*9+6}, $${idx*9+7}, $${idx*9+8}, false, $${idx*9+9})`).join(', ');
      const params = chunk.flatMap(r => [
        r.id, r.recipient_type, r.recipient_id, r.notification_type, r.title, r.message, r.details, r.is_read, r.created_at
      ]);
      await client.query(`
        INSERT INTO notifications (
          id, recipient_type, recipient_id, notification_type, title, message,
          details, is_read, is_deleted, created_at
        ) VALUES ${valStrings}
      `, params);
      notifsMigrated += chunk.length;
    }

    // Certificates
      // Certificates
      let certsMigrated = 0;
      const certId = crypto.randomUUID();
      const certNumber = 'CERT-SRM-2026-0042';
      const certTitle = 'Applied Deep Learning & NLP Mastery';
      const certUrl = 'https://storage.skillnexus.ai/certificates/CERT-SRM-2026-0042.pdf';
      const certHash = '0x94bca12ef88019acbf51726a';
      const crsDbId = courseMap.get('CRS-TN010-01');
      let certIdForEvidence = null;

      if (arunStudentId && crsDbId) {
        // Upsert certificate and retrieve its id
        const certRes = await client.query(`
          INSERT INTO certificates (
            id, student_id, institution_id, course_id, certificate_number, title,
            certificate_url, verification_hash, issued_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP - interval '10 days')
          ON CONFLICT (certificate_number) DO UPDATE SET title = EXCLUDED.title
          RETURNING id
        `, [
          certId,
          arunStudentId,
          instMap.get('TN010'),
          crsDbId,
          certNumber,
          certTitle,
          certUrl,
          certHash
        ]);
        certIdForEvidence = certRes.rows[0].id;
        certsMigrated++;
      }
      recordMigration('certificates', 1, certsMigrated);

    // Skill Evidence
    let evidenceMigrated = 0;
    if (arunStudentId) {
      const arunSkillsRes = await client.query(`
        SELECT ss.id, sk.name
        FROM student_skills ss
        JOIN skills sk ON ss.skill_id = sk.id
        WHERE ss.student_id = $1
      `, [arunStudentId]);

      const skillMapById = {};
      arunSkillsRes.rows.forEach(r => { skillMapById[r.name.toLowerCase()] = r.id; });

      const prj1Id = projectMap.get('Quantum LLM Vector Benchmarker') || projectMap.get('PRJ-338');
      const prj2Id = projectMap.get('AI Resume Analyzer & ATS Parser') || projectMap.get('PRJ-001');
      const progAttId = attemptMap.get('programming');

      // 1. Python Evidence (Assessment + Project) — idempotent via existence check
      if (skillMapById['python'] && progAttId) {
        const existingEv1 = await client.query(
          'SELECT id FROM skill_evidence WHERE student_skill_id = $1 AND evidence_type = $2 AND assessment_attempt_id = $3',
          [skillMapById['python'], 'ASSESSMENT', progAttId]
        );
        if (existingEv1.rowCount === 0) {
          await client.query(`
            INSERT INTO skill_evidence (
              id, student_skill_id, evidence_type, assessment_attempt_id,
              proof_hash, verification_status, verified_by_user_id, verified_at, faculty_notes, created_at
            ) VALUES ($1, $2, 'ASSESSMENT', $3, '0x8f32a7e910b2c', 'VALIDATED', $4, CURRENT_TIMESTAMP - interval '2 days', 'Verified score 92% on technical assessment', CURRENT_TIMESTAMP - interval '2 days')
          `, [crypto.randomUUID(), skillMapById['python'], progAttId, ramanathanUserId]);
        }
        evidenceMigrated++;
      }

      // 2. Machine Learning Evidence (Project) — idempotent via existence check
      if (skillMapById['machine learning'] && prj2Id) {
        const existingEv2 = await client.query(
          'SELECT id FROM skill_evidence WHERE student_skill_id = $1 AND evidence_type = $2 AND project_id = $3',
          [skillMapById['machine learning'], 'PROJECT', prj2Id]
        );
        if (existingEv2.rowCount === 0) {
          await client.query(`
            INSERT INTO skill_evidence (
              id, student_skill_id, evidence_type, project_id,
              proof_hash, verification_status, verified_by_user_id, verified_at, faculty_notes, created_at
            ) VALUES ($1, $2, 'PROJECT', $3, '0x68ed57e17ecbc4eb4139c3a650e180562edae844', 'VALIDATED', $4, CURRENT_TIMESTAMP - interval '14 days', 'Evaluated production AST parser and cosine similarity embedding pipeline', CURRENT_TIMESTAMP - interval '14 days')
          `, [crypto.randomUUID(), skillMapById['machine learning'], prj2Id, ramanathanUserId]);
        }
        evidenceMigrated++;
      }

      // 3. Generative AI Evidence (Project PRJ-338) — idempotent via existence check
      if (skillMapById['generative ai'] && prj1Id) {
        const existingEv3 = await client.query(
          'SELECT id FROM skill_evidence WHERE student_skill_id = $1 AND evidence_type = $2 AND project_id = $3',
          [skillMapById['generative ai'], 'PROJECT', prj1Id]
        );
        if (existingEv3.rowCount === 0) {
          await client.query(`
            INSERT INTO skill_evidence (
              id, student_skill_id, evidence_type, project_id,
              proof_hash, verification_status, verified_by_user_id, verified_at, faculty_notes, created_at
            ) VALUES ($1, $2, 'PROJECT', $3, '0x19a4e3bf602a4', 'VALIDATED', $4, CURRENT_TIMESTAMP - interval '5 days', 'Validated GPU vector benchmark latency curves and throughput', CURRENT_TIMESTAMP - interval '5 days')
          `, [crypto.randomUUID(), skillMapById['generative ai'], prj1Id, ramanathanUserId]);
        }
        evidenceMigrated++;
      }

      // 4. Certificate Evidence — idempotent via existence check
      if (skillMapById['python'] && certsMigrated > 0) {
        const existingEv4 = await client.query(
          'SELECT id FROM skill_evidence WHERE student_skill_id = $1 AND evidence_type = $2 AND certificate_id = $3',
          [skillMapById['python'], 'CERTIFICATE', certId]
        );
        if (existingEv4.rowCount === 0) {
          await client.query(`
            INSERT INTO skill_evidence (
              id, student_skill_id, evidence_type, certificate_id,
              proof_hash, verification_status, verified_by_user_id, verified_at, faculty_notes, created_at
            ) VALUES ($1, $2, 'CERTIFICATE', $3, '0x94bca12ef88019acbf51726a', 'VALIDATED', $4, CURRENT_TIMESTAMP - interval '10 days', 'Course completion verification CERT-SRM-2026-0042', CURRENT_TIMESTAMP - interval '10 days')
          `, [crypto.randomUUID(), skillMapById['python'], certIdForEvidence, ramanathanUserId]);
        }
        evidenceMigrated++;
      }
    }
    recordMigration('skill_evidence', evidenceMigrated, evidenceMigrated);

    recordMigration('projects', relDb.projects.length, projectsMigrated);
    recordMigration('project_proofs', proofsMigrated, proofsMigrated);
    recordMigration('notifications', relDb.notifications.length, notifsMigrated);

    // If DRY-RUN, perform validation inside transaction before rollback
    if (IS_DRY_RUN) {
      console.log('\n================================================================');
      console.log('        POST-MIGRATION INTEGRITY AUDIT (DRY-RUN STAGED DATA)    ');
      console.log('================================================================');
      await performValidations(client);
      await client.query('ROLLBACK');
      console.log('\nDRY-RUN completed successfully. All changes ROLLED BACK.');
    } else {
      await client.query('COMMIT');
      console.log('\nTransaction committed successfully (COMMIT). All data persisted to skillnexus_db!');
      console.log('\n================================================================');
      console.log('        POST-MIGRATION INTEGRITY AUDIT (COMMITTED DATA)         ');
      console.log('================================================================');
      await performValidations(client);
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ MIGRATION FAILED! Transaction ROLLED BACK.');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// -------------------------------------------------------------
// POST-MIGRATION VALIDATION ENGINE
// -------------------------------------------------------------
async function performValidations(client) {
  console.log('Running Foreign Key & Referential Integrity Checks...');

  const checks = [
    {
      name: 'Students -> Institutions FK validation',
      sql: 'SELECT count(*) as invalid FROM students s LEFT JOIN institutions i ON s.institution_id = i.id WHERE i.id IS NULL'
    },
    {
      name: 'Students -> Departments FK validation',
      sql: 'SELECT count(*) as invalid FROM students s LEFT JOIN departments d ON s.department_id = d.id WHERE d.id IS NULL'
    },
    {
      name: 'Student Department-Institution Compound Integrity',
      sql: 'SELECT count(*) as invalid FROM students s LEFT JOIN departments d ON s.department_id = d.id AND s.institution_id = d.institution_id WHERE d.id IS NULL'
    },
    {
      name: 'User Roles -> Users & Roles FK validation',
      sql: 'SELECT count(*) as invalid FROM user_roles ur LEFT JOIN users u ON ur.user_id = u.id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.id IS NULL OR r.id IS NULL'
    },
    {
      name: 'Student Skills -> Students & Skills FK validation',
      sql: 'SELECT count(*) as invalid FROM student_skills ss LEFT JOIN students s ON ss.student_id = s.id LEFT JOIN skills sk ON ss.skill_id = sk.id WHERE s.id IS NULL OR sk.id IS NULL'
    },
    {
      name: 'Opportunities -> Companies FK validation',
      sql: 'SELECT count(*) as invalid FROM opportunities o LEFT JOIN companies c ON o.company_id = c.id WHERE c.id IS NULL'
    },
    {
      name: 'Applications -> Students & Opportunities FK validation',
      sql: 'SELECT count(*) as invalid FROM applications a LEFT JOIN students s ON a.student_id = s.id LEFT JOIN opportunities o ON a.opportunity_id = o.id WHERE s.id IS NULL OR o.id IS NULL'
    },
    {
      name: 'Assessment Questions -> Assessments FK validation',
      sql: 'SELECT count(*) as invalid FROM assessment_questions aq LEFT JOIN assessments a ON aq.assessment_id = a.id WHERE a.id IS NULL'
    },
    {
      name: 'Question Options -> Assessment Questions FK validation',
      sql: 'SELECT count(*) as invalid FROM question_options qo LEFT JOIN assessment_questions aq ON qo.question_id = aq.id WHERE aq.id IS NULL'
    },
    {
      name: 'Plaintext Password Leak Check',
      sql: "SELECT count(*) as invalid FROM users WHERE password_hash NOT LIKE '$2%'"
    }
  ];

  let anyCheckFailed = false;
  for (const c of checks) {
    const res = await client.query(c.sql);
    const count = parseInt(res.rows[0].invalid, 10);
    if (count === 0) {
      console.log(`  ✓ PASSED: ${c.name} (0 violations)`);
    } else {
      console.error(`  ❌ FAILED: ${c.name} (${count} violations)`);
      anyCheckFailed = true;
    }
  }

  // Row counts across all populated tables
  console.log('\nTarget Table Row Counts:');
  const countTables = [
    'roles', 'institutions', 'departments', 'institution_members',
    'users', 'user_roles', 'companies', 'company_members',
    'skill_categories', 'skills', 'students', 'student_skills',
    'assessments', 'assessment_questions', 'question_options', 'assessment_attempts',
    'opportunities', 'opportunity_skills', 'applications', 'application_stage_history',
    'courses', 'course_modules', 'course_skills', 'enrollments',
    'certificates', 'skill_evidence',
    'projects', 'project_skills', 'project_proofs', 'notifications'
  ];

  let totalRows = 0;
  for (const t of countTables) {
    const res = await client.query(`SELECT count(*) as c FROM ${t}`);
    const cnt = parseInt(res.rows[0].c, 10);
    totalRows += cnt;
    console.log(`  - ${t.padEnd(28)} : ${cnt.toString().padStart(4)} rows`);
  }
  console.log(`\nTOTAL ROWS MIGRATED ACROSS ${countTables.length} ACTIVE TABLES: ${totalRows}`);

  if (anyCheckFailed) {
    throw new Error('Post-migration validation detected integrity check violations.');
  }
}

// Execute
runMigration().catch(err => {
  console.error('Migration execution crashed:', err);
  process.exit(1);
});
