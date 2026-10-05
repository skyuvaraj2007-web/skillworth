const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const db = require('../database/skillworthDatabase');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, 'evidence-' + uniqueSuffix + '-' + baseName + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max for video demonstrations
});

// POST /api/evidence/upload - Multipart upload (video demonstration / document / certificate)
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { skillId, skillName, competency, evidenceType, title, description, externalUrl } = req.body;
    const file = req.file;

    const isVideo = Boolean(
      (file && file.mimetype && file.mimetype.startsWith('video/')) ||
      evidenceType === 'Video Demonstration'
    );

    let fileUrl = externalUrl || '';
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';

    if (file) {
      fileUrl = '/uploads/' + file.filename;
      fileName = file.originalname;
      fileSize = file.size;
      mimeType = file.mimetype;
    }

    const learnerName = req.user.name || 'Candidate';
    const learnerId = req.user.profileId || req.user.id;

    const result = await db.submitEvidence({
      learnerId,
      learnerName,
      skillId: skillId || 'skill_general',
      skillName: skillName || 'Applied Technical Competency',
      competency: competency || 'Practical Task Execution',
      evidenceType: evidenceType || (isVideo ? 'Video Demonstration' : 'Document'),
      title: title || 'Practical Evidence Artifact',
      description: description || '',
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      isVideo,
      videoMetadata: isVideo ? { uploadedAt: new Date().toISOString(), durationSeconds: 180, format: mimeType } : null
    });

    return res.status(201).json({
      success: true,
      message: 'Evidence submitted successfully with AI preliminary telemetry.',
      evidence: result.evidence
    });
  } catch (err) {
    console.error('[SkillWorth Evidence] Upload error:', err);
    return res.status(500).json({ success: false, message: 'Error processing evidence upload.' });
  }
});

// GET /api/evidence/my - Learner's own evidence submissions
router.get('/my', requireAuth, (req, res) => {
  try {
    const learnerId = req.user.profileId || req.user.id;
    const list = db.getEvidenceByLearner(learnerId);
    return res.json({ success: true, evidence: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve evidence records.' });
  }
});

// GET /api/evidence/all - Assessor / Institution view
router.get('/all', requireAuth, (req, res) => {
  try {
    const all = db.getAllEvidenceForReview();
    return res.json({ success: true, evidence: all });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve review candidates.' });
  }
});

module.exports = router;
