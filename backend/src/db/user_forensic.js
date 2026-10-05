// Phase 2.2.1 — User Duplicate Forensic Analysis (corrected for actual schema)
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const client = new Client({
    host: 'localhost', port: 5432, user: 'postgres',
    password: process.env.PG_PASSWORD || '#9942891197@Rudra',
    database: 'skillnexus_db'
  });
  await client.connect();

  // =========================================
  // 1. IDENTIFY THE 22 USERS
  // =========================================
  const usersRes = await client.query(`
    SELECT u.id, u.email, u.is_active, u.created_at, u.updated_at,
           COALESCE(string_agg(r.code, ', '), 'NO_ROLE') as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id, u.email, u.is_active, u.created_at, u.updated_at
    ORDER BY u.created_at ASC
  `);
  console.log('=== SECTION 1: ALL ' + usersRes.rowCount + ' POSTGRESQL USERS ===\n');

  // FK reference tables to check
  const fkChecks = [
    { name: 'students', col: 'user_id' },
    { name: 'institution_members', col: 'user_id' },
    { name: 'company_members', col: 'user_id' },
    { name: 'user_roles', col: 'user_id' },
    { name: 'user_sessions', col: 'user_id' },
    { name: 'recruiters', col: 'user_id' },
    { name: 'institutions', col: 'user_id' },
    { name: 'notifications', col: 'user_id' },
    { name: 'audit_logs', col: 'user_id' },
  ];
  // Additional tables that might reference users with different column names
  const fkChecksAlt = [
    { name: 'skill_evidence', col: 'verified_by' },
    { name: 'project_proofs', col: 'verified_by' },
    { name: 'certificates', col: 'issued_by' },
    { name: 'messages', col: 'sender_id' },
    { name: 'application_stage_history', col: 'changed_by' },
  ];

  const allFkChecks = [...fkChecks, ...fkChecksAlt];

  const userDetails = [];
  for (const user of usersRes.rows) {
    const refs = {};
    for (const fk of allFkChecks) {
      try {
        const r = await client.query('SELECT COUNT(*) FROM "' + fk.name + '" WHERE "' + fk.col + '" = $1', [user.id]);
        refs[fk.name] = parseInt(r.rows[0].count, 10);
      } catch (e) {
        refs[fk.name] = 'N/A';
      }
    }
    userDetails.push({
      uuid: user.id,
      email: user.email,
      is_active: user.is_active,
      roles: user.roles,
      created_at: user.created_at,
      updated_at: user.updated_at,
      references: refs
    });
  }

  // Print each user
  for (const u of userDetails) {
    console.log('UUID: ' + u.uuid);
    console.log('  email: ' + u.email);
    console.log('  is_active: ' + u.is_active);
    console.log('  roles: ' + u.roles);
    console.log('  created_at: ' + u.created_at);
    console.log('  updated_at: ' + u.updated_at);
    const activeRefs = Object.entries(u.references).filter(function(entry) { return entry[1] > 0; });
    if (activeRefs.length > 0) {
      console.log('  FK references:');
      for (const entry of activeRefs) {
        console.log('    ' + entry[0] + ': ' + entry[1]);
      }
    } else {
      console.log('  FK references: NONE');
    }
    console.log('');
  }

  // =========================================
  // 2. COMPARE AGAINST SOURCE
  // =========================================
  const relDbPath = path.resolve('backend/data/relational_db.json');
  const relDb = JSON.parse(fs.readFileSync(relDbPath, 'utf8'));
  const sourceUsers = relDb.users || [];

  console.log('\n=== SECTION 2: SOURCE vs TARGET COMPARISON ===\n');
  console.log('Source users count: ' + sourceUsers.length);
  console.log('PostgreSQL users count: ' + usersRes.rowCount + '\n');

  // Build source email set
  const sourceEmailSet = new Set();
  for (const su of sourceUsers) {
    sourceEmailSet.add(su.email);
  }

  // Group PG users by email
  const pgEmailGroups = {};
  for (const u of userDetails) {
    if (!pgEmailGroups[u.email]) pgEmailGroups[u.email] = [];
    pgEmailGroups[u.email].push(u);
  }

  // Classify
  const classified = [];
  for (const email of Object.keys(pgEmailGroups)) {
    const group = pgEmailGroups[email];
    const inSource = sourceEmailSet.has(email);

    if (group.length === 1) {
      classified.push(Object.assign({}, group[0], { classification: inSource ? 'SOURCE_MATCH' : 'UNRESOLVED' }));
    } else {
      // Multiple PG users with same email — first one is SOURCE_MATCH, rest are EXTRA_DUPLICATE
      for (var i = 0; i < group.length; i++) {
        if (i === 0 && inSource) {
          classified.push(Object.assign({}, group[i], { classification: 'SOURCE_MATCH' }));
        } else if (inSource) {
          classified.push(Object.assign({}, group[i], { classification: 'EXTRA_DUPLICATE' }));
        } else {
          classified.push(Object.assign({}, group[i], { classification: 'UNRESOLVED' }));
        }
      }
    }
  }

  // Sort by classification then email
  classified.sort(function(a, b) {
    var order = { SOURCE_MATCH: 0, EXTRA_DUPLICATE: 1, UNRESOLVED: 2 };
    return (order[a.classification] || 3) - (order[b.classification] || 3);
  });

  console.log('--- CLASSIFICATION TABLE ---\n');
  for (const c of classified) {
    var refSummary = Object.entries(c.references).filter(function(e) { return e[1] > 0; }).map(function(e) { return e[0] + '(' + e[1] + ')'; }).join(', ');
    console.log(c.classification + ' | ' + c.email + ' | UUID: ' + c.uuid + ' | created: ' + (new Date(c.created_at)).toISOString());
    if (c.classification !== 'SOURCE_MATCH') {
      if (refSummary) {
        console.log('  WARNING: HAS REFERENCES: ' + refSummary);
      } else {
        console.log('  OK: No FK references (safe candidate for future removal)');
      }
    }
  }

  var sourceMatches = classified.filter(function(c) { return c.classification === 'SOURCE_MATCH'; });
  var extras = classified.filter(function(c) { return c.classification === 'EXTRA_DUPLICATE'; });
  var unresolved = classified.filter(function(c) { return c.classification === 'UNRESOLVED'; });
  console.log('\n--- SUMMARY ---');
  console.log('SOURCE_MATCH: ' + sourceMatches.length);
  console.log('EXTRA_DUPLICATE: ' + extras.length);
  console.log('UNRESOLVED: ' + unresolved.length);

  // =========================================
  // 3. DETAILED REFERENCES FOR EXTRA/UNRESOLVED
  // =========================================
  console.log('\n=== SECTION 3: EXTRA/UNRESOLVED REFERENCE DETAILS ===\n');
  for (const c of extras.concat(unresolved)) {
    console.log('UUID: ' + c.uuid + ' | email: ' + c.email + ' | classification: ' + c.classification);
    for (const entry of Object.entries(c.references)) {
      if (typeof entry[1] === 'number' && entry[1] > 0) {
        console.log('  ' + entry[0] + ': ' + entry[1] + ' row(s)');
      }
    }
    var hasAny = Object.values(c.references).some(function(v) { return v > 0; });
    if (!hasAny) console.log('  (no references)');
    console.log('');
  }

  // =========================================
  // TIMESTAMP PATTERN ANALYSIS
  // =========================================
  console.log('\n=== TIMESTAMP PATTERN ANALYSIS ===\n');
  var tsGroups = {};
  for (const u of userDetails) {
    var key = new Date(u.created_at).toISOString().slice(0, 19);
    if (!tsGroups[key]) tsGroups[key] = [];
    tsGroups[key].push(u.email);
  }
  for (const ts of Object.keys(tsGroups).sort()) {
    console.log(ts + ': ' + tsGroups[ts].length + ' users — ' + tsGroups[ts].join(', '));
  }

  // =========================================
  // Check if any duplicate emails exist
  // =========================================
  console.log('\n=== DUPLICATE EMAIL CHECK ===\n');
  const dupEmailRes = await client.query('SELECT email, COUNT(*) as cnt FROM users GROUP BY email HAVING COUNT(*) > 1');
  if (dupEmailRes.rowCount === 0) {
    console.log('NO duplicate emails found — all 22 users have UNIQUE emails.');
    console.log('This means the extra 11 are NOT email-duplicated copies of existing users.');
    console.log('They are distinct user accounts with different email addresses.');
  } else {
    console.log('Duplicate emails found:');
    for (const r of dupEmailRes.rows) {
      console.log('  ' + r.email + ': ' + r.cnt + ' copies');
    }
  }

  // =========================================
  // List source user emails for comparison
  // =========================================
  console.log('\n=== SOURCE USER EMAILS ===\n');
  for (const su of sourceUsers) {
    console.log(su.email + ' | role: ' + su.role + ' | id: ' + su.id);
  }

  await client.end();

  // Write full results
  const outPath = path.resolve('backend', 'user_forensic_report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    totalPgUsers: usersRes.rowCount,
    totalSourceUsers: sourceUsers.length,
    userDetails: userDetails,
    classified: classified,
    sourceUsers: sourceUsers.map(function(s) { return { email: s.email, id: s.id, role: s.role }; })
  }, null, 2));
  console.log('\nFull forensic data written to: ' + outPath);
})();
