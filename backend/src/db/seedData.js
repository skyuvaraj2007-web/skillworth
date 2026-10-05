const seedData = {
  users: [],

  skills: [
    {
      id: "sk_01",
      userId: "usr_student_01",
      name: "Python",
      level: "ADVANCED",
      masteryScore: 96,
      projectsCount: 3,
      examsPassed: "2 Exams Passed 90%+",
      specialization: "Python for Data Science Specialization",
      credentialHash: "0x34f992...301a",
      verified: true,
      category: "Programming",
      status: "verified",
      evidence: {
        repositories: ["github.com/arunkumar/py-data-engine", "github.com/arunkumar/fastapi-ml-serving"],
        examScore: "96.4%",
        proctorStamp: "PROCTOR-VERIFIED-OCT24"
      }
    },
    {
      id: "sk_02",
      userId: "usr_student_01",
      name: "Data Analytics",
      level: "INTERMEDIATE",
      masteryScore: 80,
      projectsCount: 2,
      examsPassed: "1 Audit Benchmarked",
      specialization: "Applied BI & Power BI Course",
      credentialHash: "0x8821bc...109b",
      verified: true,
      category: "Data & AI",
      status: "verified",
      evidence: {
        repositories: ["github.com/arunkumar/churn-predictive-eda"],
        examScore: "82.0%",
        proctorStamp: "PROCTOR-VERIFIED-SEP24"
      }
    },
    {
      id: "sk_03",
      userId: "usr_student_01",
      name: "Machine Learning",
      level: "BEGINNER",
      masteryScore: 60,
      projectsCount: 1,
      examsPassed: "Linear Regression Lab",
      specialization: "Algorithms • Scikit-Learn",
      credentialHash: null,
      verified: false,
      category: "Data & AI",
      status: "gap",
      criticalGap: "Model Deploy",
      recommendation: "Complete FastAPI deployment lab to unlock 14 Tier-1 pipelines"
    },
    {
      id: "sk_04",
      userId: "usr_student_01",
      name: "SQL",
      level: "INTERMEDIATE",
      masteryScore: 70,
      projectsCount: 4,
      examsPassed: "Advanced Cert SQL Mastery",
      specialization: "PostgreSQL • Window Functions",
      credentialHash: "0x98f62...501a",
      verified: true,
      category: "Database",
      status: "verified",
      evidence: {
        repositories: ["github.com/arunkumar/sql-cte-perf-lab"],
        examScore: "74.5%",
        proctorStamp: "PROCTOR-VERIFIED-AUG24"
      }
    },
    {
      id: "sk_05",
      userId: "usr_student_01",
      name: "HTML & CSS",
      level: "ADVANCED",
      masteryScore: 92,
      projectsCount: 3,
      examsPassed: "8X Lighthouse Performance",
      specialization: "Modern Layouts • Tailwind",
      credentialHash: "0x4429ae...812d",
      verified: true,
      category: "Web Development",
      status: "verified",
      evidence: {
        repositories: ["github.com/arunkumar/interactive-portfolio"],
        examScore: "98.0%",
        proctorStamp: "PROCTOR-VERIFIED-JUL24"
      }
    },
    {
      id: "sk_06",
      userId: "usr_student_01",
      name: "Communication & Teamwork",
      level: "INTERMEDIATE",
      masteryScore: 85,
      projectsCount: 8,
      examsPassed: "Soft Skill 360 Review",
      specialization: "Teamwork • Sprint Velocity",
      credentialHash: "0x7719ab...331e",
      verified: true,
      category: "Soft Skills",
      status: "verified",
      evidence: {
        endorsements: "8 Endorsements from Cohort Peers & Faculty",
        proctorStamp: "PEER-VALIDATED"
      }
    },
    {
      id: "sk_07",
      userId: "usr_student_01",
      name: "Docker & APIs",
      level: "BEGINNER",
      masteryScore: 45,
      projectsCount: 1,
      examsPassed: "1 Sandbox Lab",
      specialization: "Containerization & REST",
      credentialHash: null,
      verified: false,
      category: "Cloud & Distributed",
      status: "enrolled"
    },
    {
      id: "sk_08",
      userId: "usr_student_01",
      name: "Generative AI",
      level: "INTERMEDIATE",
      masteryScore: 68,
      projectsCount: 2,
      examsPassed: "Prompt Eng Benchmark",
      specialization: "LLMs, RAG, Embeddings",
      credentialHash: "0x1144fe...9902",
      verified: false,
      category: "Data & AI",
      status: "enrolled"
    },
    {
      id: "sk_09",
      userId: "usr_student_01",
      name: "Power BI",
      level: "BEGINNER",
      masteryScore: 30,
      projectsCount: 0,
      examsPassed: "None",
      specialization: "Executive Dashboards",
      credentialHash: null,
      verified: false,
      category: "Data & AI",
      status: "gap",
      criticalGap: "Enterprise Reporting",
      recommendation: "Missing Power BI (Est. time to close: 8 hrs) for TechCorp match"
    },
    {
      id: "sk_10",
      userId: "usr_student_01",
      name: "Vector Databases",
      level: "INTERMEDIATE",
      masteryScore: 65,
      projectsCount: 1,
      examsPassed: "ChromaDB Lab",
      specialization: "HNSW Indexes, Semantic Search",
      credentialHash: null,
      verified: false,
      category: "Data & AI",
      status: "enrolled"
    },
    {
      id: "sk_11",
      userId: "usr_student_01",
      name: "Cloud-Native (Kubernetes)",
      level: "BEGINNER",
      masteryScore: 35,
      projectsCount: 0,
      examsPassed: "None",
      specialization: "Microservices Orchestration",
      credentialHash: null,
      verified: false,
      category: "Cloud & Distributed",
      status: "gap",
      criticalGap: "K8s Deployment",
      recommendation: "Recommended after Docker Containerization sprint"
    },
    {
      id: "sk_12",
      userId: "usr_student_01",
      name: "Git & Open Source Workflow",
      level: "ADVANCED",
      masteryScore: 94,
      projectsCount: 6,
      examsPassed: "142 Verified Commits",
      specialization: "GitOps, Branching, CI/CD",
      credentialHash: "0x6618bc...4419",
      verified: true,
      category: "Tools",
      status: "verified"
    }
  ],

  assessments: [
    {
      id: "as_01",
      userId: "usr_student_01",
      track: "Logical Reasoning",
      trackCode: "LR-4416",
      status: "Completed",
      score: 84,
      maxScore: 100,
      percentile: 92.4,
      accuracy: 88,
      speedIndex: 1.2,
      duration: "45 mins",
      questionsCount: 25,
      engine: "AI Deep Engine",
      completedAt: "October 24, 2024",
      strongAreas: ["Data Wrangling", "Conditional Logic", "Array Transformations"],
      weakAreas: ["Graph Algorithms", "Memory Optimization"],
      marketImpact: "+8% boost to Data Analyst match readiness",
      marketImpactDetails: "Completing remediation closes the threshold gap for top Tier-1 analytics pipelines.",
      recommendedLearning: {
        title: "Graph Algorithms Sprint",
        duration: "3 days",
        impact: "High"
      }
    },
    {
      id: "as_02",
      userId: "usr_student_01",
      track: "Aptitude",
      trackCode: "AP-2011",
      status: "Pending Start",
      score: null,
      percentile: null,
      accuracy: 81,
      velocity: "48s Per Question",
      questionsCount: 30,
      metrics: {
        quantitativeAptitude: "82%",
        verbalAptitude: "74%",
        dataInterpretation: "89%"
      }
    },
    {
      id: "as_03",
      userId: "usr_student_01",
      track: "Programming",
      trackCode: "PR-5121",
      status: "Live Sandbox",
      executionScore: "78% Success",
      languages: ["Python", "Java", "JavaScript", "C++", "SQL"],
      format: "2 Challenges + 15 MCQ",
      gapTopics: ["Dynamic Programming", "Tree Traversal"]
    }
  ],

  learningCourses: [
    {
      id: "crs_01",
      userId: "usr_student_01",
      title: "Python for Data Science",
      category: "DATA & AI",
      progress: 75,
      completedModules: 18,
      totalModules: 24,
      hoursRemaining: 6,
      currentModule: "Module 19: Time-series Analysis with Pandas",
      completedLessons: ["Pandas Advanced", "Seaborn Visualization", "NumPy Vectorization", "Data Imputation"],
      rating: 4.9
    },
    {
      id: "crs_02",
      userId: "usr_student_01",
      title: "Generative AI Fundamentals",
      category: "BY NEXUS AI",
      progress: 42,
      completedModules: 5,
      totalModules: 12,
      hoursRemaining: 11,
      currentModule: "Module 6: Vector Databases & Embeddings",
      completedLessons: ["Transformers Architecture", "LLM Fine-Tuning", "Prompt Eng Best Practices"],
      rating: 5.0
    },
    {
      id: "crs_03",
      userId: "usr_student_01",
      title: "Advanced SQL for Data Engineering",
      category: "DATABASE",
      progress: 61,
      completedModules: 8,
      totalModules: 13,
      hoursRemaining: 4,
      currentModule: "Module 9: Partitioning & Index Tuning",
      completedLessons: ["Window Functions", "Recursive CTEs", "Indexing Blueprints"],
      rating: 4.8
    }
  ],

  weeklyTelemetry: {
    totalHours: 20.5,
    weeklyTarget: 20.0,
    hitRate: 102,
    activeStreakDays: 12,
    totalLearningHours: 48.5,
    completedCoursesCount: 3,
    badgesEarned: 4,
    activeTracksCount: 3,
    days: [
      { day: "Mon", hours: 3.2 },
      { day: "Tue", hours: 4.1 },
      { day: "Wed", hours: 2.8 },
      { day: "Thu", hours: 3.5 },
      { day: "Fri", hours: 4.0 },
      { day: "Sat", hours: 1.9, live: true },
      { day: "Sun", hours: 1.0 }
    ],
    globalReadiness: {
      overallProgress: 68,
      logicalReasoning: 72,
      aptitude: 64,
      programming: 91,
      advancedTech: 38
    }
  },

  emergingTechnologies: [
    {
      id: "tech_01",
      title: "Generative AI",
      tags: ["LLM / DIFFUSION / MULTIMODAL"],
      description: "Foundation models, LLM architectures, diffusion models, and multimodal synthesis.",
      industryDemand: 98,
      difficulty: "Intermediate",
      rating: "5.0 / 5.0",
      status: "In Progress (Enrolled - 42%)",
      slug: "generative-ai",
      category: "AI & ML",
      isTrending: true
    },
    {
      id: "tech_02",
      title: "Retrieval-Augmented Generation (RAG)",
      tags: ["PINECONE / CHROMA / HYBRID SEARCH"],
      description: "Connecting enterprise vector databases and real-time knowledge bases to LLMs for hallucination-free generation.",
      industryDemand: 94,
      difficulty: "Intermediate",
      rating: "5.0 / 5.0",
      status: "Recommended Next Step",
      slug: "rag-systems",
      category: "AI & ML",
      isTrending: true
    },
    {
      id: "tech_03",
      title: "Agentic AI & Multi-Agent Systems",
      tags: ["AUTOGEN / CREWAI / TOOL-CALLING"],
      description: "Autonomous cognitive agents executing multi-step workflows, dynamic tool calling, and human-in-the-loop validation.",
      industryDemand: 91,
      difficulty: "Advanced",
      rating: "5.0 / 5.0",
      status: "Available",
      slug: "agentic-ai",
      category: "AI & ML"
    },
    {
      id: "tech_04",
      title: "Edge AI & Embedded Intelligence",
      tags: ["TINYML / ONNX / TENSORRT"],
      description: "Optimizing neural networks (TinyML, ONNX, TensorRT) to run low-latency, energy-efficient inference on microcontrollers.",
      industryDemand: 86,
      difficulty: "Advanced",
      rating: "4.8 / 5.0",
      status: "Hardware Benchmarks Available",
      slug: "edge-ai",
      category: "Emerging & Quantum"
    },
    {
      id: "tech_05",
      title: "Cloud-Native & Kubernetes",
      tags: ["K8S / ISTIO / GITOPS / ARGO"],
      description: "Microservices orchestration, GitOps automation, dynamic service meshes, and resilient edge deployments.",
      industryDemand: 96,
      difficulty: "Intermediate",
      rating: "4.9 / 5.0",
      status: "4 Virtual Cluster Labs",
      slug: "cloud-native-k8s",
      category: "Cloud & Distributed"
    },
    {
      id: "tech_06",
      title: "Zero-Trust Cybersecurity",
      tags: ["ZERO-TRUST / CRYPTO / IAM"],
      description: "Modern threat intelligence, post-quantum cryptosystems, strict identity assertion, and zero-knowledge proofs.",
      industryDemand: 92,
      difficulty: "Intermediate",
      rating: "4.9 / 5.0",
      status: "Includes Red-Team Sim",
      slug: "zero-trust",
      category: "Cybersecurity"
    },
    {
      id: "tech_07",
      title: "Vision & Spatial Computing",
      tags: ["NERFS / GAUSSIAN SPLATTING / SLAM"],
      description: "Real-time object detection, 3D neural radiance fields (NeRFs), Gaussian splatting, and spatial mapping.",
      industryDemand: 86,
      difficulty: "Advanced",
      rating: "4.7 / 5.0",
      status: "Spatial Engine Integration",
      slug: "spatial-computing",
      category: "Emerging & Quantum"
    },
    {
      id: "tech_08",
      title: "Robotics OS (ROS 2)",
      tags: ["ROS 2 / GAZEBO / NAV2"],
      description: "Kinematics, multi-modal sensor fusion, motion trajectory planning, and autonomous navigation.",
      industryDemand: 79,
      difficulty: "Advanced",
      rating: "4.6 / 5.0",
      status: "Real-time Hardware Telemetry",
      slug: "robotics-ros2",
      category: "Emerging & Quantum"
    }
  ],

  projects: [
    {
      id: "prj_01",
      userId: "usr_student_01",
      title: "AI Chatbot using LLM + RAG",
      category: "GENERATIVE AI & LLMOPS",
      progress: 60,
      benchmarkMatch: null,
      status: "In Progress",
      statusNote: "Peer Review Pending (1 of 2 Reviews Done)",
      linkedTo: "Linked to Generative AI Fundamentals (Module 6)",
      techStack: ["Python", "FastAPI", "ChromaDB", "LangChain", "Llama 3"],
      repoUrl: "https://github.com/arunkumar/llm-rag-enterprise-assistant",
      sandboxAvailable: true,
      milestone: "M1/20 Tasks Cleared",
      ragReadinessFactor: 84
    },
    {
      id: "prj_02",
      userId: "usr_student_01",
      title: "Data Analytics & Predictive Retention Dashboard",
      category: "DATA SCIENCE & BI",
      progress: 100,
      benchmarkMatch: "94% Benchmark Match",
      status: "Validated & Minted",
      statusNote: "Cryptographically Verified • Ledger Block #NX-89214",
      linkedTo: "Linked to Digital Talent Passport for Corporate Screening",
      techStack: ["Python", "Pandas", "Streamlit", "PostgreSQL", "Scikit-Learn"],
      repoUrl: "https://github.com/arunkumar/customer-churn-retention-bi",
      demoUrl: "https://retention-dashboard-demo.nexus.app",
      sandboxAvailable: false,
      lighthouseScore: null
    },
    {
      id: "prj_03",
      userId: "usr_student_01",
      title: "Modern Developer Portfolio & Interactive Tech Sandbox",
      category: "FRONTEND & FULL STACK",
      progress: 100,
      benchmarkMatch: "100% Complete",
      status: "Completed",
      statusNote: "98 Lighthouse Score • Production CI/CD Deployed",
      linkedTo: "Public URL & Code Repos Indexed",
      techStack: ["React", "Tailwind CSS", "TypeScript", "Vite"],
      repoUrl: "https://github.com/arunkumar/dev-portfolio-sandbox",
      demoUrl: "https://arunkumar.nexusdev.app",
      sandboxAvailable: false,
      lighthouseScore: 98
    },
    {
      id: "prj_04",
      userId: "usr_student_01",
      title: "Multi-Agent Algorithmic Market Scanner",
      category: "AGENTIC AI & QUANT",
      progress: 25,
      benchmarkMatch: null,
      status: "In Progress (Sandbox Active)",
      statusNote: "Worker: sandbox-running: agent-worker-01.nexus",
      linkedTo: "Connected to Emerging Tech Radar #03",
      techStack: ["AutoGen", "Python", "Docker", "Redis"],
      repoUrl: "https://github.com/arunkumar/agentic-quant-scanner",
      sandboxAvailable: true,
      containerUptime: "4h 12m"
    }
  ],

  opportunities: [
    {
      id: "opp_01",
      title: "Data Analyst Intern",
      company: "TechCorp Global Systems",
      division: "Enterprise Analytics Division",
      type: "Internship",
      location: "Bengaluru / Remote",
      duration: "3-6 Months",
      stipend: "₹35,000 - ₹45,000 /mo",
      matchScore: 92,
      fitLabel: "Extremely High Fit Probability",
      hotHiring: true,
      cryptographicallyVerified: true,
      skillsMatrix: [
        { name: "Python", status: "Verified", isGap: false },
        { name: "SQL", status: "Verified", isGap: false },
        { name: "Data Analysis", status: "Verified", isGap: false },
        { name: "Power BI", status: "Gap", isGap: true }
      ],
      breakdown: {
        skillEvidence: { score: 85, weight: "35% Weight", details: "3 of 4 core skills verified with cryptographic ledger proof (Python, SQL, Analytics)." },
        assessmentEvidence: { score: 88, weight: "25% Weight", details: "Logical Reasoning (84/100) & Technical Aptitude tested in the 92nd percentile." },
        projectEvidence: { score: 90, weight: "25% Weight", details: "Completed Data Analytics Dashboard with live Git repository & pipeline validation." },
        learningEvidence: { score: 88, weight: "15% Weight", details: "75% completed in Python for Data Science specialization curriculum." }
      },
      synthesis: "Arun, TechCorp is prioritizing candidates with hands-on pandas and SQL execution verification. Your recent completed project and 94% quiz score exceed their junior intake threshold. Closing your Power BI gap via a 2-day micro-module will increase your match score to 98%.",
      criticalGap: {
        name: "Power BI",
        timeToClose: "8 hrs",
        recommendedCourse: "Power BI Executive Dashboard Sprint"
      }
    },
    {
      id: "opp_02",
      title: "Machine Learning Engineer Intern",
      company: "InnovateAI Labs",
      division: "Autonomous Research Lab",
      type: "Internship",
      location: "Remote (Global)",
      duration: "6 Months",
      stipend: "₹40,000 /mo",
      matchScore: 80,
      fitLabel: "Strong Alignment",
      hotHiring: false,
      cryptographicallyVerified: true,
      skillsMatrix: [
        { name: "Python", status: "Verified", isGap: false },
        { name: "PyTorch", status: "In Progress", isGap: false },
        { name: "Deep Learning", status: "In Progress", isGap: false },
        { name: "LLMOps", status: "Gap", isGap: true }
      ],
      breakdown: {
        skillEvidence: { score: 80, weight: "35% Weight", details: "High proficiency in Python; intermediate deep learning models attested." },
        assessmentEvidence: { score: 84, weight: "25% Weight", details: "Logical Reasoning top 8% national percentile." },
        projectEvidence: { score: 75, weight: "25% Weight", details: "AI Chatbot in active progress (60%)." },
        learningEvidence: { score: 82, weight: "15% Weight", details: "GenAI Fundamentals 42% complete." }
      },
      synthesis: "InnovateAI Labs evaluates production ML serving. Finishing your FastAPI sandbox lab will bridge the gap to 89% match score.",
      criticalGap: {
        name: "LLMOps & Serving",
        timeToClose: "12 hrs",
        recommendedCourse: "FastAPI + Docker Containerized Serving"
      }
    },
    {
      id: "opp_03",
      title: "GenAI Solutions Associate",
      company: "Cognitive Nexus",
      division: "AI Product Architecture",
      type: "Full-Time Convert",
      location: "Hybrid (Delhi-NCR)",
      duration: "Full-Time Convert",
      stipend: "₹50,000 /mo",
      matchScore: 78,
      fitLabel: "Moderate Alignment",
      hotHiring: false,
      cryptographicallyVerified: true,
      skillsMatrix: [
        { name: "LangChain", status: "In Progress", isGap: false },
        { name: "Vector DBs", status: "In Progress", isGap: false },
        { name: "Prompting", status: "Verified", isGap: false },
        { name: "Fine-Tuning", status: "Gap", isGap: true }
      ],
      breakdown: {
        skillEvidence: { score: 74, weight: "35% Weight", details: "Vector search in development." },
        assessmentEvidence: { score: 82, weight: "25% Weight", details: "High algorithmic velocity." },
        projectEvidence: { score: 78, weight: "25% Weight", details: "RAG project underway." },
        learningEvidence: { score: 80, weight: "15% Weight", details: "Enrolled in GenAI fundamentals." }
      },
      synthesis: "Cognitive Nexus requires end-to-end vector embeddings pipelines with LangChain and LlamaIndex.",
      criticalGap: {
        name: "Model Fine-Tuning",
        timeToClose: "14 hrs",
        recommendedCourse: "PEFT & LoRA Fine-Tuning Workshop"
      }
    },
    {
      id: "opp_04",
      title: "Quant Data Science Fellow",
      company: "AlphaQuant Global",
      division: "Algorithmic Trading & Statistical Modeling",
      type: "Fellowship",
      location: "Remote",
      duration: "4 Months",
      stipend: "₹60,000 /mo",
      matchScore: 85,
      fitLabel: "High Alignment",
      hotHiring: true,
      cryptographicallyVerified: true,
      skillsMatrix: [
        { name: "Python", status: "Verified", isGap: false },
        { name: "SQL", status: "Verified", isGap: false },
        { name: "Time-Series", status: "In Progress", isGap: false },
        { name: "Stochastic Modeling", status: "Gap", isGap: true }
      ],
      breakdown: {
        skillEvidence: { score: 86, weight: "35% Weight", details: "Solid mathematical and Python foundation." },
        assessmentEvidence: { score: 92, weight: "25% Weight", details: "Logical Reasoning percentile 92.4%." },
        projectEvidence: { score: 80, weight: "25% Weight", details: "Market Scanner active sandbox running." },
        learningEvidence: { score: 84, weight: "15% Weight", details: "High velocity in SQL and data wrangling." }
      },
      synthesis: "Strong algorithmic reasoning and market scanner project make Arun an attractive candidate for quantitative analysis.",
      criticalGap: {
        name: "Stochastic Calculus",
        timeToClose: "10 hrs",
        recommendedCourse: "Financial Math for Quantitative Traders"
      }
    }
  ],

  applications: [
    {
      id: "app_01",
      userId: "usr_student_01",
      opportunityId: "opp_01",
      appliedAt: "2024-10-25T10:30:00Z",
      status: "Passport Verified & Under Review",
      passportHash: "did:nexus:0x89419f8721cba3402ef94819d429c",
      recruiterAction: "Screening Passed • Fast-Track Scheduled"
    }
  ],

  digitalCredentials: [
    {
      id: "dc_01",
      code: "NX-3801-PY",
      title: "Python Core & Advanced",
      level: "Advanced",
      score: "96%",
      stampType: "Signed Proctor",
      verified: true,
      repos: "3 GitHub Repos Endorsed",
      timestamp: "12d ago",
      hash: "0x3801PY_SIGNED_HASH_9918"
    },
    {
      id: "dc_02",
      code: "NX-9102-SQL",
      title: "SQL & Relational Architecture",
      level: "Intermediate",
      score: "70%",
      stampType: "Query Validated",
      verified: true,
      repos: "Latency Benchmark Cleared",
      timestamp: "14d ago",
      hash: "0x9102SQL_INDEX_HASH_4401"
    },
    {
      id: "dc_03",
      code: "NX-4419-ML",
      title: "Machine Learning Foundations",
      level: "Intermediate",
      score: "65%",
      stampType: "Pipeline Certified",
      verified: true,
      repos: "Scikit-Learn Verified",
      timestamp: "24d ago",
      hash: "0x4419ML_PIPELINE_HASH_7719"
    },
    {
      id: "dc_04",
      code: "NX-7721-DV",
      title: "Data Analytics & Visualization",
      level: "Advanced",
      score: "82%",
      stampType: "Dashboard Live",
      verified: true,
      repos: "Streamlit Deployment Attested",
      timestamp: "1mo ago",
      hash: "0x7721DV_STREAMLIT_HASH_3381"
    },
    {
      id: "dc_05",
      code: "NX-3091-LLM",
      title: "Prompt Engineering & LLM APIs",
      level: "Intermediate",
      score: "75%",
      stampType: "RAG Benchmarked",
      verified: true,
      repos: "Zero-Shot Prompt Tested",
      timestamp: "5d ago",
      hash: "0x3091LLM_PROMPT_HASH_1298"
    },
    {
      id: "dc_06",
      code: "NX-1052-ALG",
      title: "Logical & Algorithmic Reasoning",
      level: "84/100 • 92.4th Percentile",
      score: "92.4%",
      stampType: "Top Percentile",
      verified: true,
      repos: "ZK-Proof Minted Block #982",
      timestamp: "3h ago",
      hash: "0x1052ALG_PROCTOR_HASH_6654"
    }
  ],

  accreditedSeals: [
    {
      id: "seal_01",
      title: "Generative AI Fundamentals",
      partner: "NEXUS AI × ScaleAI Partnership",
      sealType: "INDUSTRY SEAL",
      idCode: "ID: NX9824-SEAL"
    },
    {
      id: "seal_02",
      title: "Advanced Python for Data Science",
      partner: "Academic Center of Excellence",
      sealType: "ACADEMIC SEAL",
      idCode: "ID: IN-7714-PY-06"
    },
    {
      id: "seal_03",
      title: "Relational Query Optimization",
      partner: "PostgreSQL Specialist Level II",
      sealType: "PROCTOR BADGE",
      idCode: "ID: PL-9141-SQL-II"
    }
  ],

  institutionCohorts: [
    {
      id: "coh_01",
      name: "B.Tech CSE 2026 Batch",
      totalStudents: 420,
      readinessAverage: "76.4%",
      verifiedSkillsCount: 1840,
      placementReady: 312,
      topTrack: "Data Science & AI"
    },
    {
      id: "coh_02",
      name: "B.Tech IT 2026 Batch",
      totalStudents: 280,
      readinessAverage: "72.1%",
      verifiedSkillsCount: 1120,
      placementReady: 198,
      topTrack: "Full Stack & Cloud"
    }
  ],

  industryPings: [
    { company: "TechCorp Global Systems", date: "Today", role: "Data Analyst Intern", candidateMatch: "92%" },
    { company: "InnovateAI Labs", date: "Yesterday", role: "ML Engineer Intern", candidateMatch: "80%" },
    { company: "Cognitive Nexus", date: "3d ago", role: "GenAI Associate", candidateMatch: "78%" }
  ]
};

module.exports = seedData;
