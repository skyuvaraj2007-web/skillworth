require('dotenv').config();
const rm = require('../src/db/relationalManager');

async function main() {
  const courses = await rm.pg.query('SELECT id, title, total_modules FROM courses');
  console.log('Courses:', courses.rows);
  const modules = await rm.pg.query('SELECT id, course_id, module_index, title FROM course_modules ORDER BY course_id, module_index');
  console.log('Modules:', modules.rows);
  const enrollments = await rm.pg.query('SELECT id, student_id, course_id, status, progress_percentage FROM enrollments');
  console.log('Enrollments:', enrollments.rows);
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
