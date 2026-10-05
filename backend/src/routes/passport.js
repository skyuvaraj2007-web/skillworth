const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const digitalPassportService = require('../services/digitalPassportService');

/**
 * GET /api/passport or /api/passport/me
 * Retrieve authenticated student's full Digital Skill Passport
 */
router.get(['/', '/me'], requireAuth, async (req, res) => {
  try {
    const studentIdentifier = req.user?.studentId || req.user?.id || req.user?.email;
    const passportData = await digitalPassportService.getStudentPassport(studentIdentifier);
    res.json({
      success: true,
      data: passportData,
      passport: passportData?.passport || null,
      ...(passportData || {})
    });
  } catch (err) {
    console.error('[GET /api/passport] error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: err.message || 'Failed to load digital passport'
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const studentIdentifier = req.user?.studentId || req.user?.id || req.user?.email;
    const passportData = await digitalPassportService.getStudentPassport(studentIdentifier);
    res.json({
      success: true,
      data: passportData,
      passport: passportData
    });
  } catch (err) {
    console.error('[GET /api/passport/me] error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: err.message || 'Failed to load digital passport'
    });
  }
});

/**
 * PUT /api/passport/privacy
 * Update public toggle and privacy controls
 */
router.put('/privacy', requireAuth, async (req, res) => {
  try {
    const studentIdentifier = req.user?.studentId || req.user?.id || req.user?.email;
    const { isPublic, privacySettings } = req.body;
    const updated = await digitalPassportService.updatePassportPrivacy(studentIdentifier, {
      isPublic,
      privacySettings
    });

    res.json({
      success: true,
      message: 'Passport privacy controls updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[PUT /api/passport/privacy] error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update privacy settings'
    });
  }
});

/**
 * GET /api/passport/public/:publicId
 * Public verification route for recruiters & external viewers (NO AUTH REQUIRED)
 */
router.get('/public/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const publicPassport = await digitalPassportService.getPublicPassport(publicId);

    if (!publicPassport) {
      return res.status(404).json({
        success: false,
        message: 'Digital Skill Passport not found or invalid public verification identifier.'
      });
    }

    if (publicPassport.isPrivate) {
      return res.status(403).json({
        success: false,
        isPrivate: true,
        message: 'This Digital Skill Passport has been set to private by the candidate.'
      });
    }

    res.json({
      success: true,
      data: publicPassport
    });
  } catch (err) {
    console.error('[GET /api/passport/public/:publicId] error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Unable to verify passport. Please try again later.'
    });
  }
});

/**
 * GET /api/passport/export-jsonld
 * Export verified W3C JSON-LD credential document
 */
router.get('/export-jsonld', requireAuth, async (req, res) => {
  try {
    const studentIdentifier = req.user?.studentId || req.user?.id || req.user?.email;
    const full = await digitalPassportService.getStudentPassport(studentIdentifier);

    const jsonLd = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.skillnexus.ai/v2'
      ],
      id: `urn:uuid:${full.passport.publicId}`,
      type: ['VerifiableCredential', 'SkillNexusDigitalPassport'],
      issuer: {
        id: `did:nexus:institution:${full.student.institutionCode}`,
        name: full.student.institutionName,
        platform: 'Skill Nexus Sovereign Verification Node'
      },
      issuanceDate: full.passport.issuedAt,
      credentialSubject: {
        id: `did:nexus:student:${full.passport.publicId}`,
        name: full.student.fullName,
        institution: full.student.institutionName,
        department: full.student.departmentName,
        graduationYear: full.student.graduationYear,
        overallSkillScore: `${full.skillScore.overallScore}%`,
        readinessTier: full.skillScore.readinessTier,
        attestedSkills: full.skills.map(s => ({
          skill: s.skillName,
          category: s.category,
          proficiency: s.proficiencyLevel,
          score: `${s.score}%`,
          verificationStatus: s.verificationStatus,
          verificationSource: s.source
        })),
        verifiedProjects: full.projects.map(p => ({
          title: p.title,
          verificationStatus: p.verificationStatus,
          source: p.verificationSource,
          verificationId: p.verificationId
        })),
        verifiedCertifications: full.certifications.map(c => ({
          title: c.title,
          certificateNumber: c.certificateNumber,
          source: c.verificationSource,
          hash: c.verificationHash
        })),
        verifiedAssessments: full.assessments.map(a => ({
          title: a.title,
          company: a.companyName,
          score: `${a.score}%`,
          status: a.resultStatus,
          source: a.verificationSource
        }))
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `did:nexus:auth-ledger#${full.passport.publicId}`,
        proofPurpose: 'assertionMethod',
        proofHash: full.passport.qrHash
      }
    };

    res.setHeader('Content-Type', 'application/ld+json');
    res.setHeader('Content-Disposition', `attachment; filename="SkillNexus-Passport-${full.student.fullName.replace(/\s+/g, '_')}.jsonld"`);
    res.send(JSON.stringify(jsonLd, null, 2));
  } catch (err) {
    console.error('[GET /api/passport/export-jsonld] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
