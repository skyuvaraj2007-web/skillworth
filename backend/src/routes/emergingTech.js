const express = require('express');
const router = express.Router();
const db = require('../db');

// Deep dive detail for Generative AI (matching Page 7)
const GEN_AI_DEEP_DIVE = {
  title: 'Generative AI',
  tagline: 'Create, Innovate, Transform.',
  summary: 'Generative AI refers to foundation models and neural architectures capable of synthesizing high-fidelity text, code, imagery, audio, and structured reasoning from complex prompts.',
  marketDemand: {
    hiringVelocity: '+312% YoY',
    jobPostings: '14,280+',
    marketFriction: 'Moderate-High',
    currentReadiness: 38,
    targetBenchmark: 75
  },
  systemArchitecture: {
    title: 'High-Dimensional Latent Synthesizers & Multi-Agent Graphs',
    description: 'Observe generative AI transitioning from experimental chat interfaces into autonomous software execution fabrics, accelerated reasoning loops, and zero-shot multimodal intelligence.'
  },
  whyItMatters: [
    {
      domain: 'Healthcare',
      description: 'Accelerated drug discovery, protein folding synthesis, and clinical report summarization with clinical grounding.',
      adoption: 'High Growth'
    },
    {
      domain: 'Finance',
      description: 'Algorithmic risk modeling, real-time SEC AI document extraction, fraud synthetic pattern detection, and autonomous KYC.',
      adoption: 'Very High'
    },
    {
      domain: 'Software Engineering',
      description: 'Autonomous coding agents, copilot integration, synthesized unit tests, and continuous PR remediation.',
      adoption: 'Mission Critical'
    },
    {
      domain: 'Enterprise Knowledge',
      description: 'Dense vector semantic retrieval, context-aware policy reasoning, and live knowledge base Q&A.',
      adoption: 'Universal'
    }
  ],
  topJobRoles: [
    { role: 'AI Engineer', salary: '$125K - $180K', match: 'Match 82%', focus: 'Builds and deploys responsive production inference pipelines.' },
    { role: 'Machine Learning Engineer', salary: '$120K - $175K', match: 'Match 80%', focus: 'Optimizes model quantization, fine-tuning, and scalable distributed training.' },
    { role: 'Prompt & LLM Systems Eng', salary: '$110K - $155K', match: 'Match 75%', focus: 'Specializes in guardrails, structured JSON output extraction, multi-step agents.' },
    { role: 'Data Scientist (GenAI Focus)', salary: '$115K - $165K', match: 'Match 72%', focus: 'Evaluates hallucination rates, contextual vector retrieval experiments, and synthetic data.' }
  ],
  skillsBreakdown: [
    { skill: 'Python Architecture', userScore: 84, targetScore: 90, gap: '-6% Minor Gap' },
    { skill: 'Deep Learning Fundamentals', userScore: 68, targetScore: 85, gap: '-17% Moderate Gap' },
    { skill: 'Large Language Models & Prompting', userScore: 45, targetScore: 88, gap: '-43% Target Gap' },
    { skill: 'Vector DBs & RAG Architecture', userScore: 40, targetScore: 80, gap: '-40% Open Gap' }
  ],
  actionableRoadmap: [
    {
      step: 1,
      badge: 'STEP 1 • COURSE',
      title: 'Generative AI Fundamentals',
      provider: 'Nexus AI + ScaleAI',
      description: 'Learn foundation models, transformer architectures, token embeddings, and fine-tuning mechanics with industry-graded labs.',
      actionText: 'Enroll / View Course ->',
      actionLink: '/enroll/generative-ai'
    },
    {
      step: 2,
      badge: 'STEP 2 • PROJECT',
      title: 'Enterprise Chatbot with LLM + RAG',
      provider: 'Nexus Sandbox Pro',
      description: 'Deploy an end-to-end retrieval-augmented generation pipeline: ingest internal documentation, index dense embeddings, and run latency evaluations.',
      actionText: 'Launch Project Sandbox ->',
      actionLink: '/projects'
    },
    {
      step: 3,
      badge: 'STEP 3 • TARGET ROLE',
      title: 'TechCorp AI Intern',
      provider: 'TechCorp Global Systems',
      description: 'Focus on prompt engineering, evaluation metrics, and multi-node inference acceleration.',
      actionText: 'Preview Opportunity ->',
      actionLink: '/opportunities'
    }
  ]
};

const jwt = require('jsonwebtoken');
const relationalManager = require('../db/relationalManager');

// Helper to extract student if authenticated
async function getStudentFromReq(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    if (!decoded) return null;
    const id = decoded.studentId || decoded.id;
    if (id) {
      const s = await relationalManager.getStudentById(id);
      if (s) return s;
    }
    if (decoded.email) {
      const all = await relationalManager.getStudents();
      return all.find(s => s.email?.toLowerCase() === decoded.email.toLowerCase()) || null;
    }
    return null;
  } catch {
    return null;
  }
}

// GET /api/emerging-tech
router.get('/', async (req, res) => {
  const technologies = db.getEmergingTechnologies() || [];
  const student = await getStudentFromReq(req);
  const studentSkills = (student?.skills || []).map(s => String(s.name || '').trim().toLowerCase());

  const TECH_SKILL_MAP = {
    'generative-ai': ['python', 'machine learning', 'deep learning', 'transformers', 'nlp'],
    'rag-systems': ['python', 'vector databases', 'embeddings', 'sql', 'apis'],
    'agentic-ai': ['python', 'ai agents', 'tool calling', 'llm', 'system design'],
    'edge-ai': ['c++', 'python', 'embedded', 'neural networks', 'tinyml'],
    'cloud-native-k8s': ['docker', 'kubernetes', 'linux', 'ci/cd', 'cloud', 'devops'],
    'zero-trust-cyber': ['cybersecurity', 'cryptography', 'iam', 'networking', 'linux'],
    'quantum-computing': ['quantum', 'python', 'linear algebra', 'algorithms'],
    'spatial-computing': ['unity', 'c#', 'ar/vr', '3d graphics', 'computer vision']
  };

  const enriched = technologies.map(tech => {
    const reqSkills = TECH_SKILL_MAP[tech.slug] || ['python', 'algorithms', 'system design'];
    const matched = reqSkills.filter(rs => studentSkills.some(ss => ss.includes(rs) || rs.includes(ss)));
    const missing = reqSkills.filter(rs => !studentSkills.some(ss => ss.includes(rs) || rs.includes(ss)));
    const studentReadiness = reqSkills.length > 0 && studentSkills.length > 0
      ? Math.round((matched.length / reqSkills.length) * 100)
      : 0;

    const googleResearchUrl = `https://www.google.com/search?q=${encodeURIComponent(tech.title + ' tutorial research documentation')}`;

    return {
      ...tech,
      requiredSkills: reqSkills,
      matchedSkills: matched,
      skillGaps: missing,
      studentReadiness,
      googleResearchUrl
    };
  });

  res.json({
    success: true,
    data: enriched
  });
});

// GET /api/emerging-tech/:slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const tech = (db.getEmergingTechnologies() || []).find(t => t.slug === slug);
  const student = await getStudentFromReq(req);
  const skills = student?.skills || [];

  const baseDetail = slug === 'generative-ai' ? GEN_AI_DEEP_DIVE : {
    ...GEN_AI_DEEP_DIVE,
    title: tech?.title || 'Advanced Technology',
    summary: tech?.description || 'Frontier technological intelligence and industry curriculum.'
  };

  // Build real skills breakdown from student skills
  const skillsBreakdown = (baseDetail.skillsBreakdown || []).map(sb => {
    const matched = skills.find(s => String(s.name || '').toLowerCase().includes(sb.skill.toLowerCase().split(' ')[0]));
    const userScore = matched ? (Number(matched.confidence) || 60) : 0;
    const targetScore = sb.targetScore || 85;
    const gapNum = userScore - targetScore;
    const gapStr = gapNum >= 0 ? '✓ Ready' : `${gapNum}% Gap`;
    return {
      skill: sb.skill,
      userScore,
      targetScore,
      gap: gapStr
    };
  });

  const googleResearchUrl = `https://www.google.com/search?q=${encodeURIComponent(baseDetail.title + ' deep dive research learning guide')}`;

  res.json({
    success: true,
    data: {
      ...baseDetail,
      skillsBreakdown,
      googleResearchUrl
    }
  });
});

module.exports = router;
