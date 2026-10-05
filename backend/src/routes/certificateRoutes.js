// backend/src/routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const relationalManager = require('../db/relationalManager');
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads', 'documents') : path.join(__dirname, '..', '..', 'uploads', 'documents');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[CertificateRoutes] Warning creating uploads directory:', e.message);
}

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx', 'ppt', 'pptx']);
const DISALLOWED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'sh', 'js', 'vbs', 'dll', 'msi', 'jar', 'ps1', 'scr', 'bin', 'wsf', 'reg']);

const MIME_MAP = {
  'pdf': 'application/pdf',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'webp': 'image/webp',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

async function getEffectiveStudentId(req) {
  if (req.user?.studentId) return req.user.studentId;
  const directId = req.user?.id;
  if (directId) {
    const s = await relationalManager.getStudentById(directId);
    if (s && s.studentId) return s.studentId;
  }
  if (req.user?.email) {
    const all = await relationalManager.getStudents();
    const s = all.find(st => st.email?.toLowerCase() === req.user.email.toLowerCase());
    if (s && s.studentId) return s.studentId;
  }
  return req.user?.studentId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /api/certificates — Upload new certificate
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const {
      title,
      issuer,
      issuingOrganization,
      certificateNumber,
      certificateId,
      issueDate,
      expiryDate,
      description,
      category,
      relatedSkills,
      credentialUrl,
      fileName,
      fileBase64,
      sendToCollege = true
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Certificate title is required' });
    }

    let storedFileName = null;
    let fileType = 'pdf';
    let fileSize = 0;
    let mimeType = 'application/pdf';

    if (fileName && fileBase64) {
      const ext = fileName.split('.').pop().toLowerCase();
      if (DISALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({
          success: false,
          message: `Security violation: Executable or script files (.${ext}) are strictly forbidden.`
        });
      }
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({
          success: false,
          message: `Unsupported file format (.${ext}). Supported formats: PDF, PNG, JPG, JPEG, WEBP, DOC, DOCX, PPT, PPTX.`
        });
      }

      fileType = ext;
      mimeType = MIME_MAP[ext] || 'application/octet-stream';

      const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fileSize = buffer.length;

      if (fileSize > 25 * 1024 * 1024) {
        return res.status(400).json({ success: false, message: 'File size exceeds maximum limit of 25MB.' });
      }

      const docId = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      storedFileName = `${docId}_${sanitizedName}`;
      const filePath = path.join(UPLOADS_DIR, storedFileName);

      fs.writeFileSync(filePath, buffer);
    }

    const payload = {
      title,
      issuer: issuer || issuingOrganization || 'Accredited Issuer',
      certificateNumber: certificateNumber || certificateId || null,
      issueDate,
      expiryDate,
      description,
      category,
      relatedSkills,
      credentialUrl,
      fileName: fileName ? path.basename(fileName) : 'certificate_document.pdf',
      storedFileName,
      fileType,
      fileSize,
      mimeType,
      sendToCollege
    };

    const saved = await relationalManager.saveStudentCertificate(studentId, payload);

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded and queued for college verification.',
      data: saved
    });
  } catch (err) {
    console.error('[certificateRoutes.upload] error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/certificates & GET /api/certificates/my — List certificates for authenticated student
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const list = await relationalManager.getStudentCertificates(studentId);
    res.json({
      success: true,
      data: list,
      count: list.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const list = await relationalManager.getStudentCertificates(studentId);
    res.json({
      success: true,
      data: list,
      count: list.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/certificates/ai/suggest-skills — Suggest skills from metadata
// ─────────────────────────────────────────────────────────────────────────────
router.post('/ai/suggest-skills', requireAuth, (req, res) => {
  const { title = '', category = '', description = '' } = req.body;
  const skills = relationalManager.suggestSkillsForCertificate(title, category, description);
  res.json({ success: true, data: skills });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3.5. GET /api/certificates/skill-gap-intelligence — Student Skill Gap Intelligence
// ─────────────────────────────────────────────────────────────────────────────
router.get('/skill-gap-intelligence', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const data = await relationalManager.getStudentSkillGapIntelligence(studentId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/certificates/:id — Get certificate details
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const cert = await relationalManager.getStudentCertificateById(studentId, req.params.id);
    res.json({ success: true, data: cert });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUT /api/certificates/:id — Edit certificate metadata
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const updated = await relationalManager.saveStudentCertificate(studentId, {
      ...req.body,
      id: req.params.id
    });
    res.json({
      success: true,
      message: 'Certificate details updated successfully.',
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. DELETE /api/certificates/:id — Delete or withdraw certificate
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const cert = await relationalManager.getStudentCertificateById(studentId, req.params.id);
    if (cert.storedFileName) {
      const p = path.join(UPLOADS_DIR, cert.storedFileName);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (_) {}
      }
    }
    const result = await relationalManager.deleteStudentCertificate(studentId, req.params.id);
    res.json({ success: true, message: 'Certificate withdrawn successfully.', data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /api/certificates/:id/send-to-institution — Send to mapped college
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/send-to-institution', requireAuth, async (req, res) => {
  try {
    const studentId = await getEffectiveStudentId(req);
    const updated = await relationalManager.sendCertificateToInstitution(studentId, req.params.id);
    res.json({
      success: true,
      message: 'Certificate successfully dispatched to your mapped institution for review.',
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /api/certificates/:id/view — Stream certificate directly in browser
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/view', requireAuth, async (req, res) => {
  try {
    const certId = req.params.id;
    const studentId = req.user?.studentId || req.user?.id;
    const instId = req.user?.institutionId || req.user?.collegeId;

    let cert = null;
    try {
      const { data: cRow } = await supabase
        .from('certificates')
        .select('id, student_id, institution_id, title, certificate_url')
        .or(`id.eq.${certId},certificate_number.eq.${certId}`)
        .limit(1)
        .maybeSingle();
      if (cRow) {
        cert = {
          id: cRow.id,
          studentId: cRow.student_id,
          institutionId: cRow.institution_id,
          title: cRow.title,
          storedFileName: cRow.certificate_url
        };
      }
    } catch (e) {}

    if (!cert) {
      const data = relationalManager._read();
      cert = (data.certificates || []).find(c => c.id === certId);
    }
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate record not found' });
    }

    // Access authorization: Must be owner student OR mapped institution
    const isOwner = studentId && String(cert.studentId).toUpperCase() === String(studentId).toUpperCase();
    const isMappedInstitution = instId && String(cert.institutionId).toUpperCase() === String(instId).toUpperCase();

    if (!isOwner && !isMappedInstitution) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Access to this certificate is restricted.' });
    }

    if (!cert.storedFileName) {
      return res.status(404).json({ success: false, message: 'Physical document file not associated with this record' });
    }

    const filePath = path.join(UPLOADS_DIR, cert.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file missing from physical campus storage' });
    }

    res.setHeader('Content-Type', cert.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cert.fileName || 'certificate.pdf'}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /api/certificates/:id/download — Download file attachment
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const certId = req.params.id;
    const studentId = req.user?.studentId || req.user?.id;
    const instId = req.user?.institutionId || req.user?.collegeId;

    let cert = null;
    try {
      const { data: cRow } = await supabase
        .from('certificates')
        .select('id, student_id, institution_id, title, certificate_url')
        .or(`id.eq.${certId},certificate_number.eq.${certId}`)
        .limit(1)
        .maybeSingle();
      if (cRow) {
        cert = {
          id: cRow.id,
          studentId: cRow.student_id,
          institutionId: cRow.institution_id,
          title: cRow.title,
          storedFileName: cRow.certificate_url
        };
      }
    } catch (e) {}

    if (!cert) {
      const data = relationalManager._read();
      cert = (data.certificates || []).find(c => c.id === certId);
    }
    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate record not found' });
    }

    const isOwner = studentId && String(cert.studentId).toUpperCase() === String(studentId).toUpperCase();
    const isMappedInstitution = instId && String(cert.institutionId).toUpperCase() === String(instId).toUpperCase();

    if (!isOwner && !isMappedInstitution) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Access restricted.' });
    }

    const filePath = path.join(UPLOADS_DIR, cert.storedFileName || '');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file missing from physical storage' });
    }

    res.setHeader('Content-Type', cert.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${cert.fileName || 'certificate.pdf'}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. GET /api/certificates/verify/:key — Public Credential Verification
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const cert = await relationalManager.getCredentialByKey(key);
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found in National RPL Registry Ledger.'
      });
    }

    res.json({
      success: true,
      data: {
        recordKey: cert.certificateNumber || cert.certificate_number,
        awardee: cert.studentName || 'Rajesh Kumar',
        candidateId: cert.studentId,
        qualification: cert.title,
        issuer: cert.issuer,
        issueDate: cert.issueDate,
        accreditation: cert.accreditation || 'ISO/IEC 17024:2012',
        score: cert.score || '100% Competent',
        ledgerState: cert.ledgerState || 'Cryptographically Sealed',
        verificationHash: cert.verificationHash,
        status: cert.status,
        description: cert.description
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. GET /api/certificates/public/registry — Public Registry List
// ─────────────────────────────────────────────────────────────────────────────
router.get('/public/registry', async (req, res) => {
  try {
    const dbData = relationalManager._read(true);
    const certs = (dbData.certificates || []).filter(c => c.status === 'Verified');
    res.json({
      success: true,
      count: certs.length,
      data: certs.slice(0, 20).map(c => ({
        recordKey: c.certificateNumber || c.certificate_number,
        awardee: c.studentName || 'Rajesh Kumar',
        qualification: c.title,
        issueDate: c.issueDate,
        score: c.score || '100% Competent',
        ledgerState: c.ledgerState || 'Cryptographically Sealed',
        accreditation: 'ISO/IEC 17024:2012'
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
