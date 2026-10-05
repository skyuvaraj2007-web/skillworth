/**
 * SKILLNEXUS — Assessment Guard Service
 * 
 * Safety & Privacy Invariants:
 * - Never accuses student of cheating. Uses terms: "Potential Integrity Event", "Integrity Signal", "Review Required".
 * - Explicit student consent required before starting monitored sessions.
 * - Multi-tenant isolation: Students see only own events; Institutions see only mapped students; Industry sees only authorized candidates.
 * - Human review workflow (CONFIRMED, DISMISSED, NEEDS_MORE_REVIEW).
 */

const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

class AssessmentGuardService {
  async getClient() {
    return await pool.connect();
  }

  /**
   * Helper to resolve student UUID from various identifier forms
   */
  async resolveStudentUuid(identifier) {
    if (!identifier) return null;
    const client = await this.getClient();
    try {
      const res = await client.query(
        `SELECT s.id, s.institution_id, s.full_name as student_name, s.roll_number, u.email 
         FROM students s
         LEFT JOIN users u ON u.id = s.user_id
         WHERE s.id::text = $1 OR s.user_id::text = $1 OR s.roll_number = $1 OR u.email = $1 
         LIMIT 1`,
        [String(identifier)]
      );
      if (res.rows.length > 0) return res.rows[0];
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Start a monitoring session with explicit consent validation
   */
  async startSession({ assessmentId, studentId, consentGiven, cameraEnabled = false, microphoneEnabled = false, monitoringEnabled = true }) {
    if (!consentGiven) {
      const err = new Error('Explicit student consent is required to start a monitored assessment.');
      err.statusCode = 400;
      throw err;
    }

    const student = await this.resolveStudentUuid(studentId);
    if (!student) {
      const err = new Error(`Student record not found for identifier "${studentId}".`);
      err.statusCode = 404;
      throw err;
    }

    const client = await this.getClient();
    try {
      // Create or activate monitoring session
      const res = await client.query(
        `INSERT INTO assessment_monitoring_sessions 
          (assessment_id, student_id, started_at, consent_given, camera_enabled, microphone_enabled, monitoring_enabled, status)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6, 'ACTIVE')
         RETURNING *`,
        [assessmentId, student.id, Boolean(consentGiven), Boolean(cameraEnabled), Boolean(microphoneEnabled), Boolean(monitoringEnabled)]
      );

      return {
        success: true,
        message: 'Assessment monitoring session initialized with verified student consent.',
        session: res.rows[0]
      };
    } finally {
      client.release();
    }
  }

  /**
   * Record a potential integrity event with non-accusatory terminology
   */
  async recordEvent({ sessionId, assessmentId, studentId, eventType, durationSeconds = 0, confidence = 100, severity = 'MEDIUM', questionId = null, metadata = {} }) {
    if (!eventType) {
      const err = new Error('eventType is required.');
      err.statusCode = 400;
      throw err;
    }

    const student = await this.resolveStudentUuid(studentId);
    if (!student) {
      const err = new Error(`Student not found for identifier "${studentId}".`);
      err.statusCode = 404;
      throw err;
    }

    // Normalization of non-accusatory labels
    const normalizedSeverity = ['LOW', 'MEDIUM', 'HIGH'].includes(String(severity).toUpperCase())
      ? String(severity).toUpperCase()
      : 'MEDIUM';

    const client = await this.getClient();
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const sesRes = await client.query(
          `SELECT id FROM assessment_monitoring_sessions 
           WHERE assessment_id = $1 AND student_id = $2 AND status = 'ACTIVE' 
           ORDER BY started_at DESC LIMIT 1`,
          [assessmentId, student.id]
        );
        if (sesRes.rows.length > 0) {
          activeSessionId = sesRes.rows[0].id;
        }
      }

      const res = await client.query(
        `INSERT INTO assessment_integrity_events 
          (session_id, assessment_id, student_id, event_type, event_timestamp, duration_seconds, confidence, severity, question_id, metadata, review_status)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, 'PENDING_REVIEW')
         RETURNING *`,
        [
          activeSessionId || null,
          assessmentId,
          student.id,
          eventType,
          parseInt(durationSeconds, 10) || 0,
          parseFloat(confidence) || 100.0,
          normalizedSeverity,
          questionId ? String(questionId) : null,
          JSON.stringify({
            ...metadata,
            label: 'Potential Integrity Event',
            humanReviewRecommended: true
          })
        ]
      );

      return {
        success: true,
        message: 'Integrity signal recorded for human review.',
        event: res.rows[0]
      };
    } finally {
      client.release();
    }
  }

  /**
   * End a monitoring session
   */
  async endSession({ sessionId, assessmentId, studentId }) {
    const student = studentId ? await this.resolveStudentUuid(studentId) : null;
    const client = await this.getClient();
    try {
      let res;
      if (sessionId) {
        res = await client.query(
          `UPDATE assessment_monitoring_sessions 
           SET ended_at = NOW(), status = 'COMPLETED'
           WHERE id = $1
           RETURNING *`,
          [sessionId]
        );
      } else if (assessmentId && student) {
        res = await client.query(
          `UPDATE assessment_monitoring_sessions 
           SET ended_at = NOW(), status = 'COMPLETED'
           WHERE assessment_id = $1 AND student_id = $2 AND status = 'ACTIVE'
           RETURNING *`,
          [assessmentId, student.id]
        );
      }

      const session = res?.rows?.[0] || null;
      let durationMinutes = 0;
      if (session?.started_at && session?.ended_at) {
        durationMinutes = Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 60000);
      }

      return {
        success: true,
        message: 'Assessment monitoring session concluded.',
        session,
        durationMinutes
      };
    } finally {
      client.release();
    }
  }

  /**
   * Record question attempt telemetry
   */
  async recordQuestionAttempt({ assessmentId, studentId, questionId, answer, score = 0, isCorrect = false, timeSpentSeconds = 0, attemptNumber = 1, skillTag = null, difficulty = null }) {
    const student = await this.resolveStudentUuid(studentId);
    if (!student) {
      const err = new Error(`Student not found for identifier "${studentId}".`);
      err.statusCode = 404;
      throw err;
    }

    const client = await this.getClient();
    try {
      const res = await client.query(
        `INSERT INTO assessment_question_attempts 
          (assessment_id, student_id, question_id, answer, score, is_correct, time_spent_seconds, attempt_number, skill_tag, difficulty, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING *`,
        [
          assessmentId,
          student.id,
          String(questionId),
          typeof answer === 'object' ? JSON.stringify(answer) : String(answer || ''),
          parseFloat(score) || 0,
          Boolean(isCorrect),
          parseInt(timeSpentSeconds, 10) || 0,
          parseInt(attemptNumber, 10) || 1,
          skillTag || null,
          difficulty || null
        ]
      );

      return {
        success: true,
        data: res.rows[0]
      };
    } finally {
      client.release();
    }
  }

  /**
   * Question-level analytics for an assessment attempt
   */
  async getQuestionAnalytics({ assessmentId, studentId }) {
    const student = await this.resolveStudentUuid(studentId);
    if (!student) {
      const err = new Error(`Student not found for identifier "${studentId}".`);
      err.statusCode = 404;
      throw err;
    }

    const client = await this.getClient();
    try {
      const res = await client.query(
        `SELECT * FROM assessment_question_attempts 
         WHERE assessment_id = $1 AND student_id = $2 
         ORDER BY submitted_at ASC`,
        [assessmentId, student.id]
      );

      const attempts = res.rows;
      const skillBuckets = {};

      for (const a of attempts) {
        const skill = a.skill_tag || 'General';
        if (!skillBuckets[skill]) {
          skillBuckets[skill] = { total: 0, correct: 0, scoreTotal: 0, timeSpent: 0 };
        }
        skillBuckets[skill].total += 1;
        if (a.is_correct) skillBuckets[skill].correct += 1;
        skillBuckets[skill].scoreTotal += Number(a.score) || 0;
        skillBuckets[skill].timeSpent += Number(a.time_spent_seconds) || 0;
      }

      const strongSkills = [];
      const moderateSkills = [];
      const needsImprovement = [];

      for (const [name, data] of Object.entries(skillBuckets)) {
        const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
        const entry = {
          skill: name,
          accuracy: Math.round(accuracy),
          questionsCount: data.total,
          timeSpentSeconds: data.timeSpent
        };
        if (accuracy >= 75) strongSkills.push(entry);
        else if (accuracy >= 50) moderateSkills.push(entry);
        else needsImprovement.push(entry);
      }

      return {
        success: true,
        assessmentId,
        studentId: student.id,
        totalQuestionsAttempted: attempts.length,
        strongSkills,
        moderateSkills,
        needsImprovement,
        questionAttempts: attempts
      };
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve role-scoped Assessment Integrity Report
   */
  async getIntegrityReport({ assessmentId, studentId, requestingUser }) {
    const client = await this.getClient();
    try {
      // 1. Resolve student
      let targetStudent = null;
      if (studentId) {
        targetStudent = await this.resolveStudentUuid(studentId);
      } else if (requestingUser?.role === 'student') {
        targetStudent = await this.resolveStudentUuid(requestingUser.studentId || requestingUser.id);
      }

      if (!targetStudent) {
        const err = new Error('Student identification required for integrity report.');
        err.statusCode = 400;
        throw err;
      }

      // 2. Multi-tenant Authorization
      const userRole = String(requestingUser?.role || 'student').toLowerCase();
      if (userRole === 'student') {
        // Student can only see their own report
        const myStudent = await this.resolveStudentUuid(requestingUser.studentId || requestingUser.id);
        if (!myStudent || myStudent.id !== targetStudent.id) {
          const err = new Error('Access denied: You can only view your own assessment integrity report.');
          err.statusCode = 403;
          throw err;
        }
      } else if (userRole === 'institution' || userRole === 'academician' || userRole === 'faculty') {
        // Institution can only access students enrolled in their institution
        const userInstId = requestingUser.institutionId || requestingUser.collegeId;
        if (userInstId && targetStudent.institution_id && targetStudent.institution_id !== userInstId) {
          const err = new Error('Access denied: Student does not belong to your institution.');
          err.statusCode = 403;
          throw err;
        }
      } else if (userRole === 'company' || userRole === 'industry') {
        // Industry can only access candidates for their assessments / opportunities
        const companyId = requestingUser.companyId || requestingUser.id;
        const asmtCheck = await client.query(
          `SELECT id FROM assessments WHERE id = $1 AND company_id = $2`,
          [assessmentId, companyId]
        );
        // Also check if assigned via assessment_targets
        const targetCheck = await client.query(
          `SELECT at.id FROM assessment_targets at 
           JOIN assessments a ON a.id = at.assessment_id 
           WHERE at.assessment_id = $1 AND at.student_id = $2 AND a.company_id = $3`,
          [assessmentId, targetStudent.id, companyId]
        );
        if (asmtCheck.rows.length === 0 && targetCheck.rows.length === 0) {
          const err = new Error('Access denied: Candidate assessment is not authorized for your organization.');
          err.statusCode = 403;
          throw err;
        }
      }

      // 3. Fetch Assessment Metadata
      const asmtRes = await client.query(
        `SELECT id, title, duration_minutes, passing_score FROM assessments WHERE id = $1`,
        [assessmentId]
      );
      const assessment = asmtRes.rows[0] || { id: assessmentId, title: 'Technical Assessment', duration_minutes: 45 };

      // 4. Fetch Monitoring Session
      const sesRes = await client.query(
        `SELECT * FROM assessment_monitoring_sessions 
         WHERE assessment_id = $1 AND student_id = $2 
         ORDER BY started_at DESC LIMIT 1`,
        [assessmentId, targetStudent.id]
      );
      const session = sesRes.rows[0] || null;

      // 5. Fetch Integrity Events
      const evRes = await client.query(
        `SELECT aie.*, u.email as reviewer_email 
         FROM assessment_integrity_events aie
         LEFT JOIN users u ON u.id = aie.reviewed_by
         WHERE aie.assessment_id = $1 AND aie.student_id = $2 
         ORDER BY aie.event_timestamp ASC`,
        [assessmentId, targetStudent.id]
      );
      const events = evRes.rows;

      // 6. Aggregate telemetry statistics
      let tabSwitches = 0;
      let fullscreenExits = 0;
      let pasteAttempts = 0;
      let additionalPersons = 0;
      let phoneLikeObjects = 0;
      let faceAbsences = 0;
      let otherEvents = 0;

      for (const ev of events) {
        const type = String(ev.event_type || '').toUpperCase();
        if (type.includes('TAB_SWITCH') || type.includes('WINDOW_BLUR')) tabSwitches++;
        else if (type.includes('FULLSCREEN')) fullscreenExits++;
        else if (type.includes('PASTE')) pasteAttempts++;
        else if (type.includes('MULTIPLE_PERSON') || type.includes('ADDITIONAL_PERSON')) additionalPersons++;
        else if (type.includes('EXTERNAL_DEVICE') || type.includes('PHONE')) phoneLikeObjects++;
        else if (type.includes('FACE_ABSENT') || type.includes('NO_FACE')) faceAbsences++;
        else otherEvents++;
      }

      const totalSignals = events.length;
      const overallStatus = totalSignals === 0 ? 'NORMAL' : 'REVIEW_REQUIRED';

      let durationMinutes = assessment.duration_minutes || 45;
      if (session?.started_at && session?.ended_at) {
        durationMinutes = Math.max(1, Math.round((new Date(session.ended_at) - new Date(session.started_at)) / 60000));
      }

      return {
        success: true,
        data: {
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          student: {
            id: targetStudent.id,
            name: targetStudent.student_name,
            email: targetStudent.email,
            rollNumber: targetStudent.roll_number
          },
          durationMinutes,
          session: session ? {
            id: session.id,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            consentGiven: session.consent_given,
            cameraEnabled: session.camera_enabled,
            microphoneEnabled: session.microphone_enabled,
            status: session.status
          } : null,
          counters: {
            tabSwitches,
            fullscreenExits,
            pasteAttempts,
            additionalPersons,
            phoneLikeObjects,
            faceAbsences,
            otherEvents,
            totalSignals
          },
          overallStatus,
          statusLabel: overallStatus === 'NORMAL' ? 'Standard Assessment Flow' : 'Potential Integrity Event — Review Required',
          events: events.map(e => ({
            id: e.id,
            eventType: e.event_type,
            timestamp: e.event_timestamp,
            durationSeconds: e.duration_seconds,
            confidence: e.confidence,
            severity: e.severity,
            questionId: e.question_id,
            metadata: e.metadata,
            reviewStatus: e.review_status,
            reviewedBy: e.reviewer_email || e.reviewed_by,
            reviewedAt: e.reviewed_at
          }))
        }
      };
    } finally {
      client.release();
    }
  }

  /**
   * Human review workflow action
   */
  async reviewEvent({ eventId, reviewerUserId, reviewStatus, notes = '' }) {
    const validStatuses = ['CONFIRMED', 'DISMISSED', 'NEEDS_MORE_REVIEW'];
    const normalized = String(reviewStatus || '').toUpperCase();
    if (!validStatuses.includes(normalized)) {
      const err = new Error(`Invalid reviewStatus "${reviewStatus}". Must be one of: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const client = await this.getClient();
    try {
      const checkRes = await client.query(
        `SELECT id, metadata FROM assessment_integrity_events WHERE id = $1`,
        [eventId]
      );
      if (checkRes.rows.length === 0) {
        const err = new Error('Integrity event not found.');
        err.statusCode = 404;
        throw err;
      }

      const curMeta = checkRes.rows[0].metadata || {};
      const updatedMeta = {
        ...curMeta,
        reviewerNotes: notes,
        reviewedAt: new Date().toISOString()
      };

      const res = await client.query(
        `UPDATE assessment_integrity_events 
         SET review_status = $1, reviewed_by = $2, reviewed_at = NOW(), metadata = $3 
         WHERE id = $4 
         RETURNING *`,
        [normalized, reviewerUserId || null, JSON.stringify(updatedMeta), eventId]
      );

      return {
        success: true,
        message: `Event review status updated to "${normalized}".`,
        event: res.rows[0]
      };
    } finally {
      client.release();
    }
  }
}

module.exports = new AssessmentGuardService();
