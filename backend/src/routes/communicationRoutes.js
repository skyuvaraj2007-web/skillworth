const express = require('express');
const router = express.Router();
const relationalManager = require('../db/relationalManager');
const { requireAuth } = require('../middleware/auth');

// ═══════════════════════════════════════════════════════════════════════════════
// RICH INTERACTIVE LESSON CATALOG (Categorized & Gamified)
// ═══════════════════════════════════════════════════════════════════════════════
const LESSON_CATALOG = {
  vocabulary: [
    {
      id: 'vocab-101',
      title: 'Workplace & Executive Lexicon',
      category: 'vocabulary',
      difficulty: 'Beginner',
      xpReward: 25,
      description: 'Master essential terminology used in high-performing engineering and business teams.',
      exercises: [
        {
          id: 'v1',
          type: 'choose_word',
          question: 'Select the most appropriate word for this executive brief:',
          prompt: 'After hours of discussion, the engineering leads reached a ______ on the database migration plan.',
          options: ['consensus', 'concession', 'contention', 'conspiracy'],
          correctAnswer: 'consensus',
          explanation: '"Consensus" means general agreement among a group of people, which is standard in collaborative engineering decisions.'
        },
        {
          id: 'v2',
          type: 'match_meaning',
          question: 'Match the professional term with its correct definition:',
          pairs: [
            { term: 'Articulate', meaning: 'Express ideas clearly and effectively' },
            { term: 'Succinct', meaning: 'Brief, clear, and to the point' },
            { term: 'Tactful', meaning: 'Diplomatic and considerate in sensitive situations' },
            { term: 'Pragmatic', meaning: 'Dealing with matters sensibly and realistically' }
          ]
        },
        {
          id: 'v3',
          type: 'complete_sentence',
          question: 'Fill in the blank with the most professional phrasing:',
          prompt: 'Could you please ______ me through your thought process for this distributed cache design?',
          options: ['walk', 'push', 'chase', 'drag'],
          correctAnswer: 'walk',
          explanation: '"Walk me through" is a standard professional idiom meaning to explain something step-by-step.'
        }
      ]
    },
    {
      id: 'vocab-102',
      title: 'Technical Jargon & Client-Facing Polish',
      category: 'vocabulary',
      difficulty: 'Intermediate',
      xpReward: 35,
      description: 'Translate complex technical jargon into clear, value-oriented client communication.',
      exercises: [
        {
          id: 'v4',
          type: 'choose_word',
          question: 'Select the best phrase to explain latency to a non-technical stakeholder:',
          prompt: 'By optimizing our indexes, we significantly reduced the system\'s ______ during peak traffic.',
          options: ['response delay', 'bureaucracy', 'stagnation', 'friction cost'],
          correctAnswer: 'response delay',
          explanation: '"Response delay" intuitively describes latency without relying on intimidating server jargon.'
        },
        {
          id: 'v5',
          type: 'choose_word',
          question: 'Choose the word that reflects ownership and accountability:',
          prompt: 'I will take full ______ for coordinating the hotfix deployment tonight.',
          options: ['ownership', 'hesitation', 'complacency', 'blame'],
          correctAnswer: 'ownership',
          explanation: 'Taking "ownership" communicates proactive leadership and responsibility in team environments.'
        }
      ]
    }
  ],

  grammar: [
    {
      id: 'gram-101',
      title: 'Precision Syntax & Executive Writing',
      category: 'grammar',
      difficulty: 'Beginner',
      xpReward: 25,
      description: 'Eliminate common grammatical pitfalls in status reports, pull request summaries, and emails.',
      exercises: [
        {
          id: 'g1',
          type: 'choose_word',
          question: 'Choose the grammatically correct option for subject-verb agreement:',
          prompt: 'Neither the product manager nor the frontend developers ______ aware of the API schema change.',
          options: ['were', 'was', 'is', 'being'],
          correctAnswer: 'were',
          explanation: 'When subjects are connected by "nor", the verb agrees with the closer subject ("developers" -> plural "were").'
        },
        {
          id: 'g2',
          type: 'arrange_sentence',
          question: 'Arrange these phrases into a grammatically correct, polite request:',
          tokens: ['I would appreciate it', 'if you could review', 'the attached pull request', 'by end of day.'],
          correctOrder: ['I would appreciate it', 'if you could review', 'the attached pull request', 'by end of day.'],
          explanation: 'Standard professional business English structure puts the polite conditional frame first followed by the deliverable and timeline.'
        },
        {
          id: 'g3',
          type: 'choose_word',
          question: 'Select the correct active voice construction:',
          prompt: 'Which sentence is phrased in clear, concise active voice?',
          options: [
            'The QA team resolved the concurrency deadlock.',
            'The concurrency deadlock was resolved by the QA team.',
            'A resolution of the concurrency deadlock has been performed.',
            'Deadlock resolution was executed by QA personnel.'
          ],
          correctAnswer: 'The QA team resolved the concurrency deadlock.',
          explanation: 'Active voice places the actor ("QA team") before the verb ("resolved"), maximizing clarity.'
        }
      ]
    },
    {
      id: 'gram-102',
      title: 'Conditional Tenses & Professional Proposals',
      category: 'grammar',
      difficulty: 'Intermediate',
      xpReward: 35,
      description: 'Use modal verbs and hypothetical conditionals to propose technical architecture changes tactfully.',
      exercises: [
        {
          id: 'g4',
          type: 'choose_word',
          question: 'Select the appropriate modal verb for a constructive recommendation:',
          prompt: 'If we ______ to migrate to microservices now, our operational overhead would double.',
          options: ['were', 'was', 'have', 'will'],
          correctAnswer: 'were',
          explanation: 'The subjunctive conditional ("If we were to...") is grammatically sound for hypothetical scenarios.'
        }
      ]
    }
  ],

  reading: [
    {
      id: 'read-101',
      title: 'Incident Postmortem & Technical Analysis',
      category: 'reading',
      difficulty: 'Intermediate',
      xpReward: 30,
      description: 'Analyze an engineering incident postmortem report and identify root causes and action items.',
      exercises: [
        {
          id: 'r1',
          type: 'read_and_answer',
          passage: `INCIDENT SUMMARY: On Tuesday at 14:02 UTC, the Payment Gateway service experienced a 12-minute outage affecting 3,400 checkout transactions.
ROOT CAUSE: A newly deployed database migration script executed an unindexed foreign-key cascade lock, saturating connection pools.
MITIGATION: The deployment pipeline was immediately halted, the connection pool was recycled, and the table lock was released.
PREVENTION: Going forward, zero-downtime migration linters will enforce indexing before any schema alteration reaches staging.`,
          question: 'According to the incident postmortem, what was the primary root cause of the downtime?',
          options: [
            'An unindexed foreign-key cascade lock in a migration script',
            'DDoS attack targeting payment gateway nodes',
            'Failure of the payment gateway third-party vendor',
            'Insufficient physical memory on worker nodes'
          ],
          correctAnswer: 'An unindexed foreign-key cascade lock in a migration script',
          explanation: 'The postmortem explicitly identifies the unindexed foreign-key lock as the root cause of connection pool saturation.'
        },
        {
          id: 'r2',
          type: 'read_and_answer',
          passage: `To our valued client partners:
We are transitioning our weekly syncs to asynchronous status dashboards starting next sprint.
While live standups fostered quick rapport, team retrospectives highlighted that time-zone divergence across London and Singapore fragmented core engineering focus.
Live calls will now be reserved solely for quarterly roadmap milestones and critical architecture trade-offs.`,
          question: 'Why is the organization moving away from weekly live standups?',
          options: [
            'Time-zone differences fragmented focused engineering time',
            'The client requested a complete termination of meetings',
            'The team lacked videoconferencing licenses',
            'Engineering output decreased during asynchronous work'
          ],
          correctAnswer: 'Time-zone differences fragmented focused engineering time',
          explanation: 'The passage highlights that time-zone divergence across London and Singapore disrupted core engineering focus.'
        }
      ]
    }
  ],

  listening: [
    {
      id: 'list-101',
      title: 'Sprint Planning & Standup Comprehension',
      category: 'listening',
      difficulty: 'Intermediate',
      xpReward: 30,
      description: 'Listen to spoken sprint updates and identify project blockers, milestones, and deliverables.',
      exercises: [
        {
          id: 'l1',
          type: 'listen_and_answer',
          audioText: "Hi everyone, quick update on the authentication service. Yesterday I wrapped up the OAuth2 token refresh flow and wrote unit tests for token expiration. Today I'm blocked because the staging Redis cluster isn't accepting connections from my subnet. I've pinged Devops, but until they update the security group, I can't run integration tests.",
          question: 'What is currently blocking the engineer from proceeding with integration tests?',
          options: [
            'Staging Redis cluster is not accepting connections due to security group rules',
            'Unit tests for token expiration failed to pass',
            'DevOps rejected the OAuth2 code pull request',
            'The Redis cluster license has expired'
          ],
          correctAnswer: 'Staging Redis cluster is not accepting connections due to security group rules',
          explanation: 'The speaker clearly states that Redis is refusing connections from their subnet pending a DevOps security group update.'
        },
        {
          id: 'l2',
          type: 'listen_and_answer',
          audioText: "Welcome aboard Sarah. For your first sprint, your primary deliverable is the customer feedback webhook endpoint. Make sure your payload validator rejects any request without a valid HMAC signature. Don't worry about database writes yet—just log the payload and return a 200 OK once the signature validates.",
          question: 'What is Sarah instructed to verify on incoming webhook requests?',
          options: [
            'A valid HMAC signature',
            'A verified PostgreSQL connection',
            'A valid OAuth JWT bearer token',
            'A customer credit card number'
          ],
          correctAnswer: 'A valid HMAC signature',
          explanation: 'The lead advises Sarah to ensure the payload validator rejects requests missing a valid HMAC signature.'
        }
      ]
    }
  ],

  speaking: [
    {
      id: 'speak-101',
      title: 'Pronunciation, Articulation & Pitch',
      category: 'speaking',
      difficulty: 'Beginner',
      xpReward: 30,
      description: 'Practice speaking aloud with steady cadence, professional clarity, and articulate inflection.',
      exercises: [
        {
          id: 's1',
          type: 'speaking_practice',
          targetPhrase: 'I believe this architectural approach optimizes memory bandwidth while maintaining code maintainability.',
          phoneticHint: 'eye bih-LEEV this ar-kuh-TEK-chur-ul uh-PROHCH AHP-tuh-my-zez MEM-ree BAND-width',
          prompt: 'Speak this sentence aloud clearly into your microphone or verify your delivery cadence.',
          explanation: 'Emphasize "optimizes" and "maintainability" with clear pauses to project authority and composure.'
        },
        {
          id: 's2',
          type: 'speaking_practice',
          targetPhrase: 'Thank you for that feedback. Let me incorporate those security benchmarks before merging the pull request.',
          phoneticHint: 'THANK yoo for that FEED-bak. LET mee in-KOR-per-ate thoze sih-KYOOR-ih-tee BENCH-marks',
          prompt: 'Articulate this graceful acceptance of peer code review.',
          explanation: 'Maintaining a receptive, constructive tone demonstrates collaborative maturity during technical debates.'
        }
      ]
    }
  ],

  conversation: [
    {
      id: 'conv-101',
      title: 'Engineering Standup & Disagreeing Respectfully',
      category: 'conversation',
      difficulty: 'Intermediate',
      xpReward: 35,
      description: 'Navigate sensitive workplace dialogues: responding to blockers, constructive disagreement, and client presentations.',
      exercises: [
        {
          id: 'c1',
          type: 'conversation_choice',
          scenario: 'During an architecture review, a senior colleague suggests storing passwords with MD5 hashing to speed up query benchmarks.',
          partnerLine: '"MD5 is super fast and will give our authentication endpoint sub-millisecond response times. We should just use that."',
          options: [
            '"I understand query speed is crucial, but MD5 has known collision vulnerabilities. Using bcrypt or Argon2 ensures compliance with industry security standards."',
            '"That is terrible advice. You clearly do not understand modern cryptography."',
            '"Whatever you think is best, you have more seniority than me so let us do that."',
            '"I will stay silent and let someone else point out the mistake."'
          ],
          correctAnswer: '"I understand query speed is crucial, but MD5 has known collision vulnerabilities. Using bcrypt or Argon2 ensures compliance with industry security standards."',
          explanation: 'Acknowledging the goal (speed) while articulating objective technical facts (vulnerabilities) exemplifies high-caliber professional communication.'
        },
        {
          id: 'c2',
          type: 'conversation_choice',
          scenario: 'An interviewer asks: "Tell me about a time you made a mistake on a project and how you handled it."',
          partnerLine: '"We all make errors. Can you share an example where something went wrong and what you learned?"',
          options: [
            '"I once pushed a broken build before a demo. I immediately notified the team, helped roll back to the stable commit, and added an automated pre-commit hook so it couldn\'t happen again."',
            '"I honestly can\'t recall making any mistakes. I\'m extremely meticulous with my code."',
            '"My teammate gave me the wrong requirements, so the whole module had to be scrapped. It wasn\'t really my fault."',
            '"I broke production once, but nobody noticed so I quietly patched it the next morning."'
          ],
          correctAnswer: '"I once pushed a broken build before a demo. I immediately notified the team, helped roll back to the stable commit, and added an automated pre-commit hook so it couldn\'t happen again."',
          explanation: 'The STAR method (Situation, Task, Action, Result) with honest accountability and preventative improvements wins top interview marks.'
        }
      ]
    }
  ],

  daily: [
    {
      id: 'daily-practice-today',
      title: "Today's Daily Communication Sprint",
      category: 'daily',
      difficulty: 'Mixed',
      xpReward: 40,
      description: 'A balanced 4-question speed drill covering vocabulary, grammar, listening, and workplace dialogue.',
      exercises: [
        {
          id: 'd1',
          type: 'choose_word',
          question: 'Choose the most precise word:',
          prompt: 'The VP asked for a ______ version of the quarterly analytics slide deck for the board meeting.',
          options: ['condensed', 'diluted', 'convoluted', 'disjointed'],
          correctAnswer: 'condensed',
          explanation: '"Condensed" means made concise and concentrated, ideal for executive summaries.'
        },
        {
          id: 'd2',
          type: 'arrange_sentence',
          question: 'Order this collaborative opening statement:',
          tokens: ['Let us review', 'our current sprint velocity', 'and address any blockers', 'before we commit to new tickets.'],
          correctOrder: ['Let us review', 'our current sprint velocity', 'and address any blockers', 'before we commit to new tickets.'],
          explanation: 'A structured, proactive agenda sets an organized tone for standups and retrospectives.'
        },
        {
          id: 'd3',
          type: 'choose_word',
          question: 'Select the optimal professional response:',
          prompt: 'When a customer requests an unfeasible deadline, the most constructive approach is to:',
          options: [
            'Propose a phased release schedule delivering the highest-priority features by the target date',
            'Accept the deadline immediately and make the team work through the weekend',
            'Decline rudely and tell the customer they know nothing about software development',
            'Ignore the deadline and ship whenever the features are finished'
          ],
          correctAnswer: 'Propose a phased release schedule delivering the highest-priority features by the target date',
          explanation: 'Negotiating scope and phased milestones preserves client trust and team sustainability.'
        },
        {
          id: 'd4',
          type: 'complete_sentence',
          question: 'Complete the sentence with proper preposition:',
          prompt: 'Our engineers adhere ______ strict code review protocols before merging to the main branch.',
          options: ['to', 'at', 'with', 'for'],
          correctAnswer: 'to',
          explanation: 'The verb "adhere" always takes the preposition "to" (e.g. adhere to standards).'
        }
      ]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Initialize or normalize student communication profile
// ═══════════════════════════════════════════════════════════════════════════════
function getStudentCommProfile(student) {
  const comm = student?.communication || {};
  return {
    xp: Number(comm.xp) || 0,
    level: Number(comm.level) || 1,
    streak: Number(comm.streak) || 0,
    dailyGoal: Number(comm.dailyGoal) || 50,
    dailyGoalProgress: Number(comm.dailyGoalProgress) || 0,
    overallScore: Number(comm.overallScore) || 0,
    categories: {
      vocabulary: Number(comm.categories?.vocabulary?.score ?? comm.categories?.vocabulary ?? 0),
      grammar: Number(comm.categories?.grammar?.score ?? comm.categories?.grammar ?? 0),
      reading: Number(comm.categories?.reading?.score ?? comm.categories?.reading ?? 0),
      listening: Number(comm.categories?.listening?.score ?? comm.categories?.listening ?? 0),
      speaking: Number(comm.categories?.speaking?.score ?? comm.categories?.speaking ?? 0),
      conversation: Number(comm.categories?.conversation?.score ?? comm.categories?.conversation ?? 0)
    },
    activities: Array.isArray(comm.activities) ? comm.activities : [],
    badges: Array.isArray(comm.badges) ? comm.badges : []
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GET /api/communication/profile — Current student's communication telemetry
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    let student = await relationalManager.getStudentById(studentId);
    if (!student && req.user?.email) {
      const all = await relationalManager.getStudents();
      student = all.find(s => s.email?.toLowerCase() === req.user.email.toLowerCase());
    }

    if (!student) {
      // Brand new unprovisioned user: strictly return 0s
      return res.json({
        success: true,
        data: {
          xp: 0,
          level: 1,
          streak: 0,
          dailyGoal: 50,
          dailyGoalProgress: 0,
          overallScore: 0,
          categories: {
            vocabulary: 0,
            grammar: 0,
            reading: 0,
            listening: 0,
            speaking: 0,
            conversation: 0
          },
          activities: [],
          badges: [],
          strengths: [],
          areasToImprove: ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'conversation']
        }
      });
    }

    const profile = getStudentCommProfile(student);

    // Identify strengths and areas to improve from actual real scores
    const categoryEntries = Object.entries(profile.categories);
    const hasActivity = profile.activities.length > 0;

    const strengths = hasActivity
      ? categoryEntries.filter(([_, score]) => score >= 60).map(([cat]) => cat)
      : [];

    const areasToImprove = hasActivity
      ? categoryEntries.sort((a, b) => a[1] - b[1]).slice(0, 3).map(([cat]) => cat)
      : ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'conversation'];

    res.json({
      success: true,
      data: {
        ...profile,
        strengths,
        areasToImprove,
        completedLessonsCount: profile.activities.filter(a => a.completion).length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GET /api/communication/lessons — Full interactive lesson curriculum
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/lessons', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    let student = await relationalManager.getStudentById(studentId);
    if (!student && req.user?.email) {
      const all = await relationalManager.getStudents();
      student = all.find(s => s.email?.toLowerCase() === req.user.email.toLowerCase());
    }

    const completedLessonIds = new Set(
      (student?.communication?.activities || [])
        .filter(a => a.completion)
        .map(a => a.lessonId)
    );

    // Annotate catalog with completion state
    const annotatedCatalog = {};
    for (const [cat, lessons] of Object.entries(LESSON_CATALOG)) {
      annotatedCatalog[cat] = lessons.map(lesson => ({
        ...lesson,
        isCompleted: completedLessonIds.has(lesson.id)
      }));
    }

    res.json({
      success: true,
      data: annotatedCatalog
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. POST /api/communication/activity — Submit real lesson telemetry & recalculate
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/activity', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.studentId || req.user?.id;
    let student = await relationalManager.getStudentById(studentId);
    if (!student && req.user?.email) {
      const all = await relationalManager.getStudents();
      student = all.find(s => s.email?.toLowerCase() === req.user.email.toLowerCase());
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const {
      lessonId,
      category = 'vocabulary',
      score = 0,
      accuracy = 0,
      timeSpent = 60,
      attempts = 1,
      answers = []
    } = req.body;

    const validatedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
    const validatedAccuracy = Math.max(0, Math.min(100, Math.round(Number(accuracy) || 0)));
    const validatedTime = Math.max(5, Math.round(Number(timeSpent) || 30));
    const isCompleted = validatedScore >= 60;

    // Calculate XP earned from genuine activity
    // Base 20 XP + proportional accuracy bonus (up to 20 XP) + completion bonus
    const xpEarned = isCompleted ? Math.round(20 + (validatedAccuracy * 0.2)) : 5;

    const activityRecord = {
      activityId: `comm_act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      studentId: student.studentId || student.id,
      category: category.toLowerCase(),
      lessonId: lessonId || 'practice-session',
      score: validatedScore,
      accuracy: validatedAccuracy,
      completion: isCompleted,
      attempts: Math.max(1, Number(attempts) || 1),
      timeSpent: validatedTime,
      answersCount: Array.isArray(answers) ? answers.length : 0,
      completedAt: new Date().toISOString()
    };

    // Load and update student communication state
    const currentComm = getStudentCommProfile(student);
    const existingActivities = currentComm.activities || [];
    existingActivities.push(activityRecord);

    const newXp = currentComm.xp + xpEarned;
    const newDailyGoalProgress = Math.min(currentComm.dailyGoal, currentComm.dailyGoalProgress + xpEarned);

    // Calculate Streak based on consecutive calendar dates
    const todayStr = new Date().toISOString().split('T')[0];
    const pastCompletedDates = existingActivities
      .filter(a => a.completion)
      .map(a => (a.completedAt || '').split('T')[0])
      .filter(Boolean);

    const uniqueDates = Array.from(new Set(pastCompletedDates)).sort();
    let newStreak = currentComm.streak;

    if (uniqueDates.length <= 1) {
      newStreak = uniqueDates.length;
    } else {
      const lastDate = uniqueDates[uniqueDates.length - 1];
      const prevDate = uniqueDates[uniqueDates.length - 2];
      const diffDays = Math.round((new Date(lastDate) - new Date(prevDate)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = Math.max(1, currentComm.streak + 1);
      } else if (diffDays === 0) {
        newStreak = Math.max(1, currentComm.streak);
      } else {
        newStreak = 1;
      }
    }

    // Recalculate Subcategory Scores from all recorded activities
    const catScores = { ...currentComm.categories };
    const CAT_KEYS = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'conversation'];

    for (const catKey of CAT_KEYS) {
      const catActivities = existingActivities.filter(a => a.category === catKey);
      if (catActivities.length > 0) {
        const avgScore = catActivities.reduce((s, a) => s + (a.score || 0), 0) / catActivities.length;
        const avgAccuracy = catActivities.reduce((s, a) => s + (a.accuracy || 0), 0) / catActivities.length;
        // Mastery blends average score (60%) and accuracy (40%)
        catScores[catKey] = Math.round(Math.min(100, avgScore * 0.6 + avgAccuracy * 0.4));
      } else if (category === 'daily' && isCompleted) {
        // Daily practice boosts all categories proportionally if they were zero
        if (catScores[catKey] === 0) {
          catScores[catKey] = Math.round(validatedScore * 0.25);
        }
      }
    }

    // If this was a specific category activity, ensure it updates directly
    if (CAT_KEYS.includes(category.toLowerCase())) {
      const thisCatActs = existingActivities.filter(a => a.category === category.toLowerCase());
      const thisAvg = thisCatActs.reduce((s, a) => s + a.score, 0) / thisCatActs.length;
      catScores[category.toLowerCase()] = Math.round(Math.min(100, thisAvg));
    }

    // Derive Overall Communication from the 6 subcategories
    const overallScore = Math.round(
      CAT_KEYS.reduce((sum, k) => sum + (catScores[k] || 0), 0) / CAT_KEYS.length
    );

    // Calculate Level
    // Level 1: 0 - 99 XP
    // Level 2: 100 - 299 XP
    // Level 3: 300 - 599 XP
    // Level 4: 600 - 999 XP
    // Level 5: 1000+ XP
    let newLevel = 1;
    if (newXp >= 1000) newLevel = 5;
    else if (newXp >= 600) newLevel = 4;
    else if (newXp >= 300) newLevel = 3;
    else if (newXp >= 100) newLevel = 2;

    // Badges calculation
    const badges = [...(currentComm.badges || [])];
    const addBadgeIfNew = (badgeId, title, icon, desc) => {
      if (!badges.some(b => b.id === badgeId)) {
        badges.push({ id: badgeId, title, icon, description: desc, earnedAt: new Date().toISOString() });
      }
    };

    if (existingActivities.length >= 1) {
      addBadgeIfNew('first_lesson', 'First Steps', '🌱', 'Completed your first communication exercise!');
    }
    if (validatedAccuracy === 100) {
      addBadgeIfNew('perfect_score', 'Flawless Articulation', '🎯', 'Scored 100% accuracy on a communication lesson!');
    }
    if (newStreak >= 3) {
      addBadgeIfNew('streak_3', 'Habit Builder', '🔥', 'Maintained a 3-day communication learning streak!');
    }
    if (overallScore >= 50) {
      addBadgeIfNew('intermediate_speaker', 'Articulate Scholar', '🎙️', 'Achieved 50%+ overall communication proficiency!');
    }

    // Persist to relational manager
    const updatedComm = {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      dailyGoal: currentComm.dailyGoal,
      dailyGoalProgress: newDailyGoalProgress,
      overallScore,
      categories: catScores,
      activities: existingActivities,
      badges,
      lastActiveDate: todayStr
    };

    student.communication = updatedComm;
    student.capabilities = student.capabilities || {};
    student.capabilities.communication = overallScore;

    if (typeof relationalManager.updateStudent === 'function') {
      await relationalManager.updateStudent(student.studentId || student.id, {
        communication: updatedComm,
        capabilities: student.capabilities
      });
    } else if (!relationalManager.isPgRequired) {
      // Direct JSON sync fallback
      const data = relationalManager._read();
      const sIdx = (data.students || []).findIndex(s =>
        s.studentId === student.studentId || s.id === student.id || s.email === student.email
      );
      if (sIdx >= 0) {
        data.students[sIdx].communication = updatedComm;
        data.students[sIdx].capabilities = student.capabilities;
        relationalManager._write(data);
      }
    }

    res.json({
      success: true,
      message: 'Communication activity recorded and skill recalculated successfully.',
      data: {
        xpEarned,
        isCompleted,
        activity: activityRecord,
        communication: updatedComm,
        capabilities: student.capabilities
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
