const { supabase } = require('./supabaseClient');

/**
 * SkillWorth Supabase Synchronization Helper
 * Safely persists entity updates to Supabase PostgreSQL without blocking local execution.
 */

async function syncUser(user, profile) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.id || user.userId,
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role,
      preferred_language: user.preferredLanguage || 'en',
      profile_id: user.profileId || profile?.id || null,
      name: profile?.fullName || profile?.institutionName || profile?.companyName || null,
      phone: profile?.phone || profile?.officialPhone || null,
      verification_status: user.verificationStatus || 'ACTIVE',
      metadata: profile || {}
    });
    if (error) console.warn('[Supabase Sync User Warning]:', error.message);
  } catch (err) {
    console.warn('[Supabase Sync User Error]:', err.message);
  }
}

async function syncApplication(app) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('rpl_applications').upsert({
      id: app.id,
      application_number: app.applicationNumber || app.id,
      candidate_id: app.candidateId || app.workerId || 'anonymous',
      candidate_name: app.candidateName || app.workerName || null,
      candidate_email: app.candidateEmail || null,
      qualification_pack_code: app.qualificationPackCode || 'QP-GEN-01',
      occupation: app.occupation || 'General Practitioner',
      nsqf_level: app.nsqfLevel || 4,
      status: app.status || 'DRAFT',
      assigned_assessor_id: app.assignedAssessorId || null,
      assigned_assessor_name: app.assignedAssessorName || null,
      scheduled_date: app.scheduledDate || null,
      scheduled_time: app.scheduledTime || null,
      assessment_centre_id: app.assessmentCentreId || null,
      timeline: app.timeline || [],
      audit_trail: app.auditTrail || []
    });
    if (error) console.warn('[Supabase Sync Application Warning]:', error.message);
  } catch (err) {
    console.warn('[Supabase Sync Application Error]:', err.message);
  }
}

async function syncEvidence(evidence) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('rpl_evidence').upsert({
      id: evidence.id,
      application_id: evidence.applicationId || null,
      worker_id: evidence.workerId || evidence.candidateId || 'anonymous',
      title: evidence.title || 'Evidence Artifact',
      description: evidence.description || null,
      file_path: evidence.filePath || null,
      file_url: evidence.fileUrl || null,
      file_name: evidence.fileName || null,
      evidence_type: evidence.evidenceType || 'DOCUMENT',
      verified: Boolean(evidence.verified),
      competency_code: evidence.competencyCode || null,
      ai_analysis: evidence.aiAnalysis || {}
    });
    if (error) console.warn('[Supabase Sync Evidence Warning]:', error.message);
  } catch (err) {
    console.warn('[Supabase Sync Evidence Error]:', err.message);
  }
}

async function syncAssessment(assessment) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('rpl_assessments').upsert({
      id: assessment.id,
      application_id: assessment.applicationId || null,
      worker_id: assessment.workerId || 'anonymous',
      occupation: assessment.occupation || 'General Practitioner',
      qualification_pack_code: assessment.qualificationPackCode || 'QP-GEN-01',
      status: assessment.status || 'PENDING',
      score: assessment.score || 0,
      competency_matrix: assessment.competencyMatrix || [],
      decision: assessment.decision || null,
      decision_notes: assessment.decisionNotes || null,
      assessor_id: assessment.assessorId || null,
      assessor_name: assessment.assessorName || null,
      scheduled_date: assessment.scheduledDate || null,
      scheduled_time: assessment.scheduledTime || null
    });
    if (error) console.warn('[Supabase Sync Assessment Warning]:', error.message);
  } catch (err) {
    console.warn('[Supabase Sync Assessment Error]:', err.message);
  }
}

async function syncCredential(cred) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('rpl_credentials').upsert({
      id: cred.id || cred.credentialId,
      credential_id: cred.credentialId || cred.id,
      candidate_id: cred.candidateId || cred.workerId || 'anonymous',
      candidate_name: cred.candidateName || cred.workerName || 'Candidate',
      qualification_pack_code: cred.qualificationPackCode || 'QP-GEN-01',
      occupation: cred.occupation || 'Trade Specialist',
      nsqf_level: cred.nsqfLevel || 4,
      score: cred.score || 0,
      grade: cred.grade || 'A',
      issued_date: cred.issuedDate || new Date().toISOString(),
      qr_code_url: cred.qrCodeUrl || null,
      verification_url: cred.verificationUrl || null,
      metadata: cred.metadata || {}
    });
    if (error) console.warn('[Supabase Sync Credential Warning]:', error.message);
  } catch (err) {
    console.warn('[Supabase Sync Credential Error]:', err.message);
  }
}

async function syncNotification(notif) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('notifications').upsert({
      id: notif.id,
      user_id: notif.userId || notif.recipientId || 'anonymous',
      title: notif.title || 'Notification',
      message: notif.message || '',
      type: notif.type || 'SYSTEM',
      read: Boolean(notif.read),
      action_url: notif.actionUrl || null
    });
    if (error) console.warn('[Supabase Sync Notification Warning]:', error.message);
  } catch (err) {
    console.warn('[Supabase Sync Notification Error]:', err.message);
  }
}

module.exports = {
  syncUser,
  syncApplication,
  syncEvidence,
  syncAssessment,
  syncCredential,
  syncNotification
};
