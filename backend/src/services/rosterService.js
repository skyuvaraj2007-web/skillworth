const crypto = require('crypto');

/**
 * Standard CSV and Roster Management Service for SkillNexus AI
 * Implements strict tabular parsing, field normalization, in-file duplicate detection,
 * institutional department tenant validation, and diff generation.
 */

// Official header specification
const OFFICIAL_HEADERS = [
  'Student Name',
  'College Email',
  'Roll Number',
  'Phone Number',
  'Department',
  'Batch',
  'Graduation Year'
];

/**
 * Parses raw CSV / TSV text cleanly supporting quotes, escaped characters, and multiline values
 */
function parseCSV(text) {
  if (!text) return [];
  // Strip UTF-8 BOM if present
  let cleanText = text.replace(/^\uFEFF/, '');
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === '\t') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
  }

  return rows;
}

/**
 * Maps raw row array to normalized key-value object
 */
function normalizeRowHeaders(headers, row) {
  const obj = {};
  headers.forEach((h, idx) => {
    const val = (row[idx] || '').trim();
    const cleanHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanHeader.includes('name') && !cleanHeader.includes('college')) {
      obj.name = val;
    } else if (cleanHeader.includes('email')) {
      obj.email = val.toLowerCase();
    } else if (cleanHeader.includes('roll') || cleanHeader.includes('regno') || cleanHeader.includes('registration')) {
      obj.rollNumber = val;
    } else if (cleanHeader.includes('phone') || cleanHeader.includes('mobile') || cleanHeader.includes('contact')) {
      obj.phoneNumber = val;
    } else if (cleanHeader.includes('department') || cleanHeader.includes('dept')) {
      obj.department = val;
    } else if (cleanHeader.includes('batch')) {
      obj.batch = val;
    } else if (cleanHeader.includes('year') || cleanHeader.includes('grad')) {
      obj.graduationYear = val ? parseInt(val.replace(/\D/g, ''), 10) : 2026;
    }
  });

  if (!obj.batch && obj.graduationYear) {
    obj.batch = `${obj.graduationYear - 4}-${obj.graduationYear}`;
  }

  return obj;
}

/**
 * Generates official CSV template string
 */
function generateTemplateCSV() {
  const headerLine = OFFICIAL_HEADERS.join(',');
  const exampleRows = [
    'Rahul Sharma,rahul.sharma@srmist.edu.in,22CS101,9876543210,Computer Science and Engineering,2022-2026,2026',
    'Priya Sundaram,priya.s@srmist.edu.in,22IT102,9876543211,Information Technology,2022-2026,2026',
    'Karthik Raja,karthik.r@srmist.edu.in,22EC103,9876543212,Electronics and Communication Engineering,2022-2026,2026'
  ];
  return [headerLine, ...exampleRows].join('\n');
}

/**
 * Validates and previews uploaded file contents against institutional department roster
 */
function validateAndPreviewRoster({ rawContent, institutionDepartments = [], existingStudents = [] }) {
  const parsedRows = parseCSV(rawContent);

  if (parsedRows.length < 2) {
    return {
      success: false,
      message: 'The uploaded file contains no data rows. Please ensure your file includes header and student rows.',
      metrics: { totalRows: 0, validRows: 0, invalidRows: 0, newCount: 0, updatedCount: 0, unchangedCount: 0, duplicateRows: 0 },
      rows: [],
      errors: []
    };
  }

  const rawHeaders = parsedRows[0];
  const dataRows = parsedRows.slice(1);

  // Normalize allowed departments for this institution
  const deptLookup = new Map();
  institutionDepartments.forEach(d => {
    deptLookup.set(d.name.toLowerCase().trim(), d);
    deptLookup.set(d.code.toLowerCase().trim(), d);
    // Also strip spaces and special characters for flexible matching
    deptLookup.set(d.name.toLowerCase().replace(/[^a-z0-9]/g, ''), d);
    deptLookup.set(d.code.toLowerCase().replace(/[^a-z0-9]/g, ''), d);
  });

  // Track in-file duplicates
  const seenRollNumbers = new Map();
  const seenEmails = new Map();

  const previewRows = [];
  const errors = [];

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let duplicateCount = 0;

  dataRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // 1-indexed including header
    const student = normalizeRowHeaders(rawHeaders, rawRow);
    const rowErrors = [];

    // 1. Mandatory Field Checks
    if (!student.name) rowErrors.push('Student Name is required');
    if (!student.email) {
      rowErrors.push('College Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      rowErrors.push(`Invalid email format: "${student.email}"`);
    }
    if (!student.rollNumber) rowErrors.push('Roll Number is required');

    // 2. In-file duplicate detection
    if (student.rollNumber) {
      const cleanRoll = student.rollNumber.toLowerCase().trim();
      if (seenRollNumbers.has(cleanRoll)) {
        rowErrors.push(`Duplicate Roll Number in file (first seen at Row ${seenRollNumbers.get(cleanRoll)})`);
        duplicateCount++;
      } else {
        seenRollNumbers.set(cleanRoll, rowNumber);
      }
    }

    if (student.email) {
      const cleanEmail = student.email.toLowerCase().trim();
      if (seenEmails.has(cleanEmail)) {
        rowErrors.push(`Duplicate College Email in file (first seen at Row ${seenEmails.get(cleanEmail)})`);
      } else {
        seenEmails.set(cleanEmail, rowNumber);
      }
    }

    // 3. Department Tenant Validation
    let resolvedDepartment = null;
    if (!student.department) {
      rowErrors.push('Department is required');
    } else {
      const cleanDeptQuery = student.department.toLowerCase().trim();
      const strippedQuery = cleanDeptQuery.replace(/[^a-z0-9]/g, '');
      resolvedDepartment = deptLookup.get(cleanDeptQuery) || deptLookup.get(strippedQuery);

      if (!resolvedDepartment) {
        rowErrors.push(`Department "${student.department}" does not belong to this institution. Authorized: [${institutionDepartments.map(d => d.code).join(', ')}]`);
      }
    }

    // If row has validation errors, record and continue
    if (rowErrors.length > 0) {
      errors.push({
        rowNumber,
        rollNumber: student.rollNumber || 'N/A',
        studentName: student.name || 'N/A',
        email: student.email || 'N/A',
        errors: rowErrors
      });

      previewRows.push({
        rowNumber,
        ...student,
        status: 'ERROR',
        errors: rowErrors,
        changes: []
      });
      return;
    }

    // 4. Cross-check against database existing students
    const cleanRoll = (student.rollNumber || '').toLowerCase().trim();
    const cleanEmail = (student.email || '').toLowerCase().trim();

    const existingMatch = existingStudents.find(s => 
      (s.roll_number && s.roll_number.toLowerCase().trim() === cleanRoll) ||
      (s.regNo && s.regNo.toLowerCase().trim() === cleanRoll) ||
      (s.email && s.email.toLowerCase().trim() === cleanEmail)
    );

    if (!existingMatch) {
      newCount++;
      previewRows.push({
        rowNumber,
        ...student,
        departmentId: resolvedDepartment?.id,
        departmentName: resolvedDepartment?.name || student.department,
        departmentCode: resolvedDepartment?.code,
        status: 'NEW',
        action: 'NEW',
        changes: []
      });
    } else {
      // Check for field changes (e.g. Department changed CSE -> IT)
      const changes = [];
      const existingDeptName = existingMatch.department || existingMatch.department_name || '';
      const newDeptName = resolvedDepartment?.name || student.department;

      if (existingDeptName && newDeptName && existingDeptName.toLowerCase().trim() !== newDeptName.toLowerCase().trim()) {
        changes.push({ field: 'Department', from: existingDeptName, to: newDeptName });
      }

      const existingName = existingMatch.full_name || existingMatch.name || '';
      if (existingName && student.name && existingName.toLowerCase().trim() !== student.name.toLowerCase().trim()) {
        changes.push({ field: 'Student Name', from: existingName, to: student.name });
      }

      const existingBatch = existingMatch.batch || '';
      if (existingBatch && student.batch && existingBatch !== student.batch) {
        changes.push({ field: 'Batch', from: existingBatch, to: student.batch });
      }

      if (changes.length > 0) {
        updatedCount++;
        previewRows.push({
          rowNumber,
          ...student,
          studentId: existingMatch.id || existingMatch.studentId,
          departmentId: resolvedDepartment?.id,
          departmentName: resolvedDepartment?.name || student.department,
          departmentCode: resolvedDepartment?.code,
          status: 'UPDATED',
          action: 'UPDATED',
          changes
        });
      } else {
        unchangedCount++;
        previewRows.push({
          rowNumber,
          ...student,
          studentId: existingMatch.id || existingMatch.studentId,
          departmentId: resolvedDepartment?.id,
          departmentName: resolvedDepartment?.name || student.department,
          departmentCode: resolvedDepartment?.code,
          status: 'ALREADY_UP_TO_DATE',
          action: 'UNCHANGED',
          changes: []
        });
      }
    }
  });

  const totalRows = dataRows.length;
  const invalidRows = errors.length;
  const validRows = totalRows - invalidRows;

  return {
    success: true,
    metrics: {
      totalRows,
      validRows,
      invalidRows,
      newCount,
      updatedCount,
      unchangedCount,
      duplicateRows: duplicateCount
    },
    rows: previewRows,
    errors
  };
}

/**
 * Generates CSV string of errors for download
 */
function generateErrorReportCSV(errors = []) {
  const headers = ['Row Number,Roll Number,Student Name,College Email,Validation Errors'];
  const lines = errors.map(e => {
    const errorStr = (e.errors || []).join('; ').replace(/"/g, '""');
    return `${e.rowNumber},"${e.rollNumber}","${e.studentName}","${e.email}","${errorStr}"`;
  });
  return [headers, ...lines].join('\n');
}

module.exports = {
  OFFICIAL_HEADERS,
  parseCSV,
  generateTemplateCSV,
  validateAndPreviewRoster,
  generateErrorReportCSV
};
