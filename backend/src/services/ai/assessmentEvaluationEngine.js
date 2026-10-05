/**
 * SKILL NEXUS AI — Assessment Evaluation Engine
 * 
 * Implements automated, server-side grading for Feature 3: Industry Assessment Builder:
 * - Sanitized test delivery (never exposes correct answers or hidden test cases)
 * - Automated evaluation of MCQ, Multiple Answer, Numerical, Programming, Logical Reasoning, Aptitude
 * - Secure code execution via sandbox with test cases
 * - Transparent Skill-wise Performance calculation
 * - Persistence into assessment_targets, assessment_attempts, assessment_answers, and assessment_results
 * - Zero client-side trust: all grading happens strictly on backend
 */

const { supabase } = require('../../config/supabase');
const relationalManager = require('../../db/relationalManager');
const programmingExecutionService = require('../programmingExecutionService');

class AssessmentEvaluationEngine {
  /**
   * Securely retrieve assessment for a student to take (sanitized: NO answers exposed)
   */
  async getSanitizedAssessmentForStudent(assessmentId, studentIdentifier) {
    const student = await relationalManager.getStudentById(studentIdentifier);
    if (!student) {
      throw new Error('Student profile not found or unauthorized');
    }

    const { data: asmt, error: aErr } = await supabase
      .from('assessments')
      .select(`
        id,
        track_code,
        title,
        domain,
        description,
        instructions,
        time_limit_minutes,
        duration_minutes,
        total_marks,
        passing_score,
        difficulty,
        categories,
        skills,
        skill_weights,
        random_order,
        random_options,
        status,
        company_id,
        settings,
        companies (
          company_name,
          logo_url
        )
      `)
      .eq('id', assessmentId)
      .maybeSingle();

    if (aErr || !asmt) {
      throw new Error('Assessment not found');
    }

    if (asmt.status !== 'PUBLISHED') {
      throw new Error('This assessment is not currently active or published.');
    }

    // Verify candidate is targeted
    const { data: target, error: tErr } = await supabase
      .from('assessment_targets')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', student.id)
      .maybeSingle();

    if (tErr || !target) {
      throw new Error('Access denied: You are not assigned to take this assessment.');
    }

    // Fetch questions
    const { data: questions, error: qErr } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true });

    if (qErr) throw qErr;

    // Sanitize questions: strip correct answers, explanations, and hidden test cases
    let sanitizedQuestions = (questions || []).map(q => {
      let publicTestCases = [];
      if (Array.isArray(q.test_cases)) {
        publicTestCases = q.test_cases
          .filter(tc => !tc.isHidden && !tc.is_hidden)
          .map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput || tc.expected_output
          }));
      }

      let options = Array.isArray(q.options) ? [...q.options] : [];
      if (asmt.random_options && options.length > 0 && q.question_type === 'MCQ') {
        options = options.sort(() => Math.random() - 0.5);
      }

      return {
        id: q.id,
        topic: q.topic,
        category: q.category,
        questionType: q.question_type || 'MCQ',
        difficulty: q.difficulty || 'Intermediate',
        skills: q.skills || (q.category ? [q.category] : []),
        questionText: q.question_text,
        marks: Number(q.marks || 1),
        options,
        programmingLanguage: q.programming_language || 'JavaScript',
        starterCode: q.starter_code || '',
        inputDescription: q.input_description || '',
        outputDescription: q.output_description || '',
        constraints: q.constraints || '',
        publicTestCases
      };
    });

    if (asmt.random_order) {
      sanitizedQuestions = sanitizedQuestions.sort(() => Math.random() - 0.5);
    }

    // Mark status as IN_PROGRESS if first opening
    if (target.status === 'ASSIGNED') {
      await supabase
        .from('assessment_targets')
        .update({
          status: 'IN_PROGRESS',
          started_at: new Date().toISOString()
        })
        .eq('id', target.id);
    }

    return {
      assessment: {
        id: asmt.id,
        title: asmt.title,
        companyName: asmt.companies?.company_name || 'Enterprise Partner',
        description: asmt.description,
        instructions: asmt.instructions,
        durationMinutes: asmt.time_limit_minutes || asmt.duration_minutes || 45,
        totalMarks: asmt.total_marks || 100,
        passingScore: asmt.passing_score || 60,
        difficulty: asmt.difficulty,
        skills: asmt.skills || [],
        categories: asmt.categories || [],
        questionCount: sanitizedQuestions.length,
        settings: (typeof asmt.settings === 'string' ? (() => { try { return JSON.parse(asmt.settings); } catch (e) { return {}; } })() : (asmt.settings || {})),
        programmingLanguage: (typeof asmt.settings === 'object' && asmt.settings?.programmingLanguage) || (typeof asmt.settings === 'string' && (() => { try { return JSON.parse(asmt.settings).programmingLanguage; } catch (e) { return null; } })()) || (Array.isArray(asmt.skills) ? asmt.skills[0] : (typeof asmt.skills === 'string' ? (() => { try { return JSON.parse(asmt.skills)[0]; } catch (e) { return 'JavaScript'; } })() : 'JavaScript')),
        projectTitle: (typeof asmt.settings === 'object' && asmt.settings?.projectTitle) || (typeof asmt.settings === 'string' && (() => { try { return JSON.parse(asmt.settings).projectTitle; } catch (e) { return null; } })()) || 'Applied Engineering Project',
        projectDomain: (typeof asmt.settings === 'object' && asmt.settings?.projectDomain) || asmt.domain || 'Software Systems',
        projectDescription: (typeof asmt.settings === 'object' && asmt.settings?.projectDescription) || asmt.description,
        projectDeliverables: (typeof asmt.settings === 'object' && asmt.settings?.projectDeliverables) || 'Comprehensive code implementation and verified unit test execution.',
        starterCode: (typeof asmt.settings === 'object' && asmt.settings?.starterCode) || '',
        deadline: (typeof asmt.settings === 'object' && asmt.settings?.deadline) || null
      },
      target: {
        id: target.id,
        status: target.status === 'ASSIGNED' ? 'IN_PROGRESS' : target.status,
        startedAt: target.started_at || new Date().toISOString()
      },
      questions: sanitizedQuestions
    };
  }

  /**
   * Evaluate student submission on backend with zero client-side trust
   */
  async evaluateSubmission({ assessmentId, studentIdentifier, answers = {} }) {
    const student = await relationalManager.getStudentById(studentIdentifier);
    if (!student) {
      throw new Error('Student profile not found');
    }

    // Verify candidate target
    const { data: target, error: tErr } = await supabase
      .from('assessment_targets')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', student.id)
      .maybeSingle();

    if (tErr || !target) {
      throw new Error('Student is not assigned to this assessment.');
    }

    // Fetch assessment & full questions with correct answers
    const { data: asmt, error: aErr } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .maybeSingle();

    if (aErr || !asmt) throw new Error('Assessment not found');

    const { data: questions, error: qErr } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (qErr) throw qErr;

    let earnedMarks = 0;
    let totalMarks = 0;
    const questionBreakdown = [];
    const skillMetrics = {}; // { [skillName]: { earned: 0, total: 0 } }

    const registerSkillMarks = (skillName, earned, total) => {
      if (!skillName) return;
      const sClean = skillName.trim();
      if (!skillMetrics[sClean]) skillMetrics[sClean] = { earned: 0, total: 0 };
      skillMetrics[sClean].earned += earned;
      skillMetrics[sClean].total += total;
    };

    for (const q of (questions || [])) {
      const qMarks = Number(q.marks || 1);
      totalMarks += qMarks;

      const userAns = answers[q.id] !== undefined ? answers[q.id] : answers[String(q.id)];
      const qType = (q.question_type || 'MCQ').toUpperCase();
      let questionEarned = 0;
      let isCorrect = false;
      let executionResult = null;

      // Extract skills attributed to this question
      let qSkills = [];
      if (Array.isArray(q.skills)) {
        qSkills = q.skills;
      } else if (typeof q.skills === 'string') {
        try { qSkills = JSON.parse(q.skills); } catch (e) { qSkills = [q.skills]; }
      }
      if (!Array.isArray(qSkills) || qSkills.length === 0) {
        qSkills = q.category ? [q.category] : ['General'];
      }

      if (qType === 'PROGRAMMING' || q.category === 'Programming' || qType === 'CODE') {
        // Evaluate programming question via test cases
        const studentCode = typeof userAns === 'string' ? userAns : (userAns?.code || '');
        let testCases = [];
        if (Array.isArray(q.test_cases)) {
          testCases = q.test_cases;
        } else if (typeof q.test_cases === 'string') {
          try { testCases = JSON.parse(q.test_cases); } catch (e) { testCases = []; }
        }
        const execRes = await programmingExecutionService.executeCode(
          studentCode,
          q.programming_language || 'JavaScript',
          testCases
        );
        executionResult = execRes;
        const passRatio = execRes.totalCount > 0 ? (execRes.passedCount / execRes.totalCount) : 0;
        questionEarned = Math.round(passRatio * qMarks * 10) / 10;
        isCorrect = execRes.status === 'SUCCESS' && execRes.passedCount === execRes.totalCount;
      } else if (qType === 'MULTIPLE_ANSWER') {
        // Evaluate multiple selections (e.g. ['GET', 'PUT', 'DELETE'])
        let correctList = [];
        if (Array.isArray(q.multiple_answers)) {
          correctList = q.multiple_answers;
        } else if (typeof q.multiple_answers === 'string') {
          try { correctList = JSON.parse(q.multiple_answers); } catch (e) { correctList = q.multiple_answers.split(','); }
        } else if (q.correct_answer) {
          correctList = String(q.correct_answer).split(',');
        }
        const correctSet = new Set(correctList.map(s => String(s).trim().toLowerCase()));

        let userSet = new Set();
        if (Array.isArray(userAns)) {
          userSet = new Set(userAns.map(s => String(s).trim().toLowerCase()));
        } else if (typeof userAns === 'string') {
          userSet = new Set(userAns.split(',').map(s => s.trim().toLowerCase()));
        }

        let matchCount = 0;
        userSet.forEach(ans => {
          if (correctSet.has(ans)) matchCount++;
          else matchCount = Math.max(0, matchCount - 0.5); // minor deduction for incorrect multi-select
        });

        const ratio = correctSet.size > 0 ? Math.max(0, matchCount / correctSet.size) : 0;
        questionEarned = Math.round(ratio * qMarks * 10) / 10;
        isCorrect = ratio === 1.0;
      } else if (qType === 'NUMERICAL') {
        // Numerical with tolerance check
        const targetNum = Number(q.numerical_answer !== null && q.numerical_answer !== undefined ? q.numerical_answer : q.correct_answer);
        const userNum = Number(userAns);
        const tolerance = Number(q.numerical_tolerance || 0);

        if (!isNaN(userNum) && !isNaN(targetNum) && Math.abs(userNum - targetNum) <= tolerance) {
          questionEarned = qMarks;
          isCorrect = true;
        } else {
          questionEarned = 0;
          isCorrect = false;
        }
      } else {
        // Standard MCQ, Logical Reasoning, Aptitude
        const normUserAns = String(userAns || '').trim().toLowerCase();
        const normCorrectAns = String(q.correct_answer || '').trim().toLowerCase();
        if (normUserAns && normUserAns === normCorrectAns) {
          questionEarned = qMarks;
          isCorrect = true;
        } else {
          questionEarned = 0;
          isCorrect = false;
        }
      }

      earnedMarks += questionEarned;

      // Distribute marks to question's skills
      qSkills.forEach(sk => {
        registerSkillMarks(sk, questionEarned, qMarks);
      });

      questionBreakdown.push({
        questionId: q.id,
        category: q.category,
        questionType: qType,
        skills: qSkills,
        earnedMarks: questionEarned,
        totalMarks: qMarks,
        isCorrect,
        executionResult
      });
    }

    const scorePercentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;
    const passingBenchmark = Number(asmt.passing_score || 60);
    const passed = scorePercentage >= passingBenchmark;

    // Calculate skill-wise percentage performance
    const skillWisePerformance = {};
    Object.keys(skillMetrics).forEach(sk => {
      const metric = skillMetrics[sk];
      skillWisePerformance[sk] = metric.total > 0
        ? Math.round((metric.earned / metric.total) * 100)
        : 0;
    });

    const completedAt = new Date().toISOString();

    // 1. Update assessment_targets
    await supabase
      .from('assessment_targets')
      .update({
        status: 'COMPLETED',
        score: scorePercentage,
        total_marks: totalMarks,
        result_status: passed ? 'PASSED' : 'FAILED',
        submitted_at: completedAt,
        feedback: {
          breakdown: questionBreakdown,
          skillWisePerformance,
          earnedMarks,
          totalMarks,
          scorePercentage,
          passed
        }
      })
      .eq('id', target.id);

    // 2. Insert into assessment_attempts
    const { data: attemptRow } = await supabase
      .from('assessment_attempts')
      .insert({
        assessment_id: assessmentId,
        student_id: student.id,
        started_at: target.started_at || completedAt,
        completed_at: completedAt,
        status: 'Completed',
        score: scorePercentage
      })
      .select()
      .maybeSingle();

    // 3. Save individual answers to assessment_answers
    try {
      if (attemptRow) {
        const answerRows = questionBreakdown.map(b => ({
          attempt_id: attemptRow.id,
          question_id: b.questionId,
          is_correct: b.isCorrect,
          marks_awarded: b.earnedMarks,
          answer_text: typeof answers[b.questionId] === 'object' ? JSON.stringify(answers[b.questionId]) : String(answers[b.questionId] || ''),
          execution_result: b.executionResult
        }));
        await supabase.from('assessment_answers').insert(answerRows);
      }
    } catch (ansErr) {
      console.debug('[AssessmentEngine] assessment_answers note:', ansErr.message);
    }

    // 4. Update student skill growth engine
    try {
      const { recordAssessmentSkillGrowth } = require('../skillGrowthEngine');
      await recordAssessmentSkillGrowth({
        studentId: student.id,
        assessmentId,
        score: scorePercentage,
        skillScores: skillWisePerformance
      });
    } catch (gErr) {
      console.debug('[AssessmentEngine] skillGrowthEngine note:', gErr.message);
    }

    return {
      success: true,
      assessmentId,
      studentId: student.id,
      studentName: student.fullName || student.name,
      score: scorePercentage,
      scorePercentage,
      earnedMarks,
      totalMarks,
      passingBenchmark,
      passed,
      resultStatus: passed ? 'PASSED' : 'FAILED',
      skillWisePerformance,
      questionBreakdown,
      completedAt
    };
  }
}

module.exports = new AssessmentEvaluationEngine();
