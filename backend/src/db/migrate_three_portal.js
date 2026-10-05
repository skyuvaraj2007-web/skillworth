const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'skillnexus_db'
      }
);

async function runMigration() {
  console.log('🚀 Running 001_three_portal_collaboration.sql migration...');
  const sqlPath = path.join(__dirname, 'migrations', '001_three_portal_collaboration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    console.log('✅ Base tables and columns created successfully.');

    // Populate course_programming_languages for existing courses
    const coursesRes = await client.query('SELECT id, title, category FROM courses');
    const langsRes = await client.query('SELECT id, code FROM programming_languages');
    const langMap = {};
    langsRes.rows.forEach(l => { langMap[l.code] = l.id; });

    for (const c of coursesRes.rows) {
      const titleLower = (c.title || '').toLowerCase();
      const catLower = (c.category || '').toLowerCase();
      const mappedLangs = [];

      if (titleLower.includes('deep learning') || titleLower.includes('nlp') || titleLower.includes('ai') || catLower.includes('artificial intelligence')) {
        if (langMap['python']) mappedLangs.push(langMap['python']);
      }
      if (titleLower.includes('go') || titleLower.includes('systems') || titleLower.includes('kubernetes')) {
        if (langMap['go']) mappedLangs.push(langMap['go']);
        if (langMap['python']) mappedLangs.push(langMap['python']);
      }
      if (titleLower.includes('react') || titleLower.includes('full-stack') || titleLower.includes('web')) {
        if (langMap['javascript']) mappedLangs.push(langMap['javascript']);
        if (langMap['typescript']) mappedLangs.push(langMap['typescript']);
        if (langMap['sql']) mappedLangs.push(langMap['sql']);
      }
      if (titleLower.includes('java')) {
        if (langMap['java']) mappedLangs.push(langMap['java']);
      }
      if (mappedLangs.length === 0) {
        if (langMap['python']) mappedLangs.push(langMap['python']);
        if (langMap['javascript']) mappedLangs.push(langMap['javascript']);
      }

      for (const lId of mappedLangs) {
        await client.query(
          `INSERT INTO course_programming_languages (course_id, programming_language_id)
           VALUES ($1, $2)
           ON CONFLICT (course_id, programming_language_id) DO NOTHING`,
          [c.id, lId]
        );
      }
    }
    console.log(`✅ Associated ${coursesRes.rows.length} existing courses with programming languages.`);

    await client.query('COMMIT');
    console.log('🎉 Migration completed successfully and committed!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
