-- ============================================================================
-- SKILLNEXUS AI — PRODUCTION SEED DATA (PostgreSQL / Supabase)
-- Realistic Demonstration Data for Tamil Nadu Campuses, Students, and Companies
-- ============================================================================

-- 1. SEED USERS
INSERT INTO users (id, email, password_hash, role, is_verified, avatar_url) VALUES
('a0000001-0000-0000-0000-000000000001', 'arun.kumar@nexus.edu', '$2a$10$w8PqWkX7F5n0R7FvK4a2QOqUe5/8t4C9B4Z2yW5Z4c7v.d8g6X9xW', 'STUDENT', true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('a0000001-0000-0000-0000-000000000002', 'placements@srmist.edu.in', '$2a$10$w8PqWkX7F5n0R7FvK4a2QOqUe5/8t4C9B4Z2yW5Z4c7v.d8g6X9xW', 'INSTITUTION', true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('a0000001-0000-0000-0000-000000000003', 'talent@abctech.com', '$2a$10$w8PqWkX7F5n0R7FvK4a2QOqUe5/8t4C9B4Z2yW5Z4c7v.d8g6X9xW', 'COMPANY', true, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (email) DO NOTHING;

-- 2. SEED INSTITUTIONS
INSERT INTO institutions (institution_id, institution_name, institution_code, type, state, district, city, address, pincode, website, official_email, phone, dean_name, placement_rate, student_count, departments, verification_status) VALUES
('TN010', 'SRM Institute of Science and Technology', 'SRM-KTR-01', 'Deemed University', 'Tamil Nadu', 'Chengalpattu', 'Kattankulathur', 'SRM Nagar, Kattankulathur', '603203', 'https://www.srmist.edu.in', 'placements@srmist.edu.in', '+91 44 2741 7000', 'Prof. K. Ramanathan', 94.2, 1420, '["CSE", "IT", "AI & DS", "ECE", "EEE", "Mechanical"]'::jsonb, 'VERIFIED'),
('TN001', 'Anna University (CEG Campus)', 'AU-CEG-01', 'State University', 'Tamil Nadu', 'Chennai', 'Guindy', 'Sardar Patel Road, Guindy', '600025', 'https://www.annauniv.edu', 'tpo@annauniv.edu', '+91 44 2235 7004', 'Dr. M. Shanmugam', 96.8, 2150, '["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil"]'::jsonb, 'VERIFIED'),
('TN030', 'PSG College of Technology', 'PSG-CBE-01', 'Autonomous', 'Tamil Nadu', 'Coimbatore', 'Peelamedu', 'Avinashi Road, Peelamedu', '641004', 'https://www.psgtech.edu', 'placement@psgtech.edu', '+91 422 257 2177', 'Dr. V. Radhakrishnan', 95.4, 1680, '["CSE", "IT", "AI & DS", "ECE", "Robotics"]'::jsonb, 'VERIFIED')
ON CONFLICT (institution_id) DO NOTHING;

-- 3. SEED STUDENTS
INSERT INTO students (student_id, college_id, reg_no, name, email, phone, department, degree, batch, year, semester, cgpa, backlogs, career_goal, preferred_roles, headline, profile_image, readiness_score, placement_status) VALUES
('STU-TN010-001', 'TN010', 'RA2211003010001', 'Arun Kumar', 'arun.kumar@nexus.edu', '+91 98765 43210', 'CSE', 'B.Tech', '2022-2026', 'III Year', 'Sem 6', 8.92, 0, 'Data Scientist & AI Systems Engineer', '["Data Scientist", "AI/ML Engineer", "Full Stack Developer"]'::jsonb, 'B.Tech CSE • Aspiring Data Scientist & AI Systems Engineer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 92, 'Placement Ready'),
('STU-TN010-002', 'TN010', 'RA2211003010045', 'Priya Sundaram', 'priya.sundaram@nexus.edu', '+91 98765 43211', 'ECE', 'B.Tech', '2023-2027', 'II Year', 'Sem 4', 9.15, 0, 'Embedded Systems & Edge AI Architect', '["IoT Specialist", "Edge AI Engineer", "Firmware Developer"]'::jsonb, 'B.Tech ECE • Embedded Systems & Edge AI Researcher', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 88, 'Placement Ready'),
('STU-TN010-003', 'TN010', 'RA2211003010112', 'Karthik Raja', 'karthik.raja@nexus.edu', '+91 98765 43212', 'AI & DS', 'B.Tech', '2022-2026', 'III Year', 'Sem 6', 8.45, 0, 'MLOps & Distributed AI Engineer', '["MLOps Engineer", "Cloud AI Architect", "Data Engineer"]'::jsonb, 'B.Tech AI & DS • MLOps & Distributed AI Pipelines', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 84, 'Under Mentorship'),
('STU-TN001-001', 'TN001', 'AU22101001', 'Kaviya Selvan', 'kaviya.s@annauniv.edu', '+91 98765 43213', 'CSE', 'B.Tech', '2022-2026', 'III Year', 'Sem 6', 9.40, 0, 'Systems Architect & Distributed Systems', '["Cloud Architect", "Backend Systems Engineer"]'::jsonb, 'B.Tech CSE CEG • Distributed Systems & High-Throughput DBs', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', 95, 'Placement Ready'),
('STU-TN001-002', 'TN001', 'AU22101054', 'Divya Bharathi', 'divya.b@annauniv.edu', '+91 98765 43214', 'IT', 'B.Tech', '2023-2027', 'II Year', 'Sem 4', 8.78, 0, 'Cybersecurity & Zero-Trust Infrastructure', '["Security Analyst", "DevSecOps Engineer"]'::jsonb, 'B.Tech IT CEG • Cryptography & DevSecOps Lead', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', 86, 'Placement Ready')
ON CONFLICT (student_id) DO NOTHING;

-- 4. SEED COMPANIES
INSERT INTO companies (company_id, company_name, registration_number, industry, company_type, company_size, founded_year, website, state, city, tier, verification_status) VALUES
('COMP-001', 'ABC Technologies', 'U72200TN2018PTC123456', 'Information Technology & AI Solutions', 'Enterprise', '500-1000', 2018, 'https://abctech.example.com', 'Tamil Nadu', 'Chennai (OMR IT Expressway)', 'Tier 1 Prime Partner', 'VERIFIED'),
('COMP-002', 'CloudScale Systems', 'U72900KA2020PTC654321', 'Cloud Infrastructure & Distributed Systems', 'MNC', '1000+', 2016, 'https://cloudscale.example.com', 'Karnataka', 'Bengaluru', 'Tier 1 Prime Partner', 'VERIFIED'),
('COMP-003', 'Apex Financial AI', 'U67190MH2021PTC987654', 'Fintech & Algorithmic Intelligence', 'Enterprise', '200-500', 2021, 'https://apexfin.example.com', 'Maharashtra', 'Mumbai', 'Strategic Hiring Partner', 'VERIFIED'),
('COMP-004', 'Infosys Springboard', 'L85110KA1981PLC013115', 'Global Technology Consulting', 'Enterprise', '10000+', 1981, 'https://infosys.com', 'Karnataka', 'Bengaluru', 'Global Corporate Sponsor', 'VERIFIED')
ON CONFLICT (company_id) DO NOTHING;

-- 5. SEED RECRUITERS
INSERT INTO recruiters (company_id, name, designation, email, phone, linkedin, is_verified) VALUES
('COMP-001', 'Sarah Jenkins', 'Head of Talent Acquisition & Campus Partnerships', 'talent@abctech.com', '+91 99400 12345', 'https://linkedin.com/in/sarahjenkins-tech', true),
('COMP-002', 'Vikram Anand', 'Director of Engineering & Emerging Talent', 'vikram.anand@cloudscale.com', '+91 98840 54321', 'https://linkedin.com/in/vikramanand-dev', true),
('COMP-003', 'Priya Menon', 'Lead Quantitative Recruitment Lead', 'priya.menon@apexfin.com', '+91 97720 98765', 'https://linkedin.com/in/priyamenon-hr', true)
ON CONFLICT (email) DO NOTHING;

-- 6. SEED SKILLS
INSERT INTO skills (id, skill_name, category, description, difficulty, industry_demand, is_emerging) VALUES
('b0000001-0000-0000-0000-000000000001', 'Python', 'Programming', 'Core language for data science, machine learning pipelines, and backend APIs', 'Advanced', 'HIGH', false),
('b0000001-0000-0000-0000-000000000002', 'SQL', 'Data & AI', 'Relational database querying, CTEs, window functions, and schema design', 'Advanced', 'HIGH', false),
('b0000001-0000-0000-0000-000000000003', 'React', 'Programming', 'Component-based frontend architecture, hooks, state management, and virtual DOM', 'Intermediate', 'HIGH', false),
('b0000001-0000-0000-0000-000000000004', 'Machine Learning', 'Data & AI', 'Supervised, unsupervised algorithms, model evaluation, scikit-learn, and feature engineering', 'Advanced', 'VERY HIGH', false),
('b0000001-0000-0000-0000-000000000005', 'FastAPI', 'Programming', 'High-performance asynchronous RESTful APIs, Pydantic validation, and OpenAPI specs', 'Intermediate', 'HIGH', false),
('b0000001-0000-0000-0000-000000000006', 'Docker', 'Cloud & Distributed', 'Containerization, multi-stage builds, container networks, and Docker Compose orchestration', 'Intermediate', 'HIGH', false),
('b0000001-0000-0000-0000-000000000007', 'Generative AI', 'Data & AI', 'Large Language Models, vector embeddings, prompt engineering, and fine-tuning', 'Advanced', 'CRITICAL', true),
('b0000001-0000-0000-0000-000000000008', 'RAG (Retrieval-Augmented Generation)', 'Data & AI', 'Semantic search, hybrid chunking, vector databases, and grounded LLM generation', 'Advanced', 'CRITICAL', true),
('b0000001-0000-0000-0000-000000000009', 'PostgreSQL', 'Data & AI', 'ACID transactions, JSONB, indexing strategies, triggers, and full-text search', 'Advanced', 'HIGH', false),
('b0000001-0000-0000-0000-000000000010', 'Power BI', 'Data & AI', 'Business intelligence reporting, DAX measures, data modeling, and KPI dashboards', 'Intermediate', 'MODERATE', false),
('b0000001-0000-0000-0000-000000000011', 'Kubernetes', 'Cloud & Distributed', 'Pod scheduling, ingress routing, statefulsets, Helm charts, and cluster scaling', 'Advanced', 'HIGH', false),
('b0000001-0000-0000-0000-000000000012', 'AWS', 'Cloud & Distributed', 'Cloud architectures, EC2, S3, RDS, Lambda, IAM, and VPC networking', 'Intermediate', 'HIGH', false)
ON CONFLICT (skill_name) DO NOTHING;

-- 7. SEED STUDENT SKILLS (Multi-Evidence Breakdown for Arun Kumar STU-TN010-001)
INSERT INTO student_skills (student_id, skill_id, proficiency_level, confidence_score, assessment_score, course_score, project_score, faculty_verified, has_assessment, has_course, has_project, has_inst_seal, verification_status) VALUES
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000001', 'Advanced', 94, 94, 96, 91, true, true, true, true, true, 'VERIFIED'),
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000002', 'Advanced', 88, 88, 92, 85, true, true, true, true, true, 'VERIFIED'),
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000003', 'Intermediate', 82, 80, 85, 82, true, true, true, true, false, 'VERIFIED'),
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000004', 'Advanced', 87, 86, 90, 85, true, true, true, true, true, 'VERIFIED'),
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000005', 'Intermediate', 78, 0, 80, 76, true, false, true, true, false, 'VERIFIED'),
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000006', 'Beginner', 58, 0, 0, 58, false, false, false, true, false, 'UNVERIFIED'),
('STU-TN010-001', 'b0000001-0000-0000-0000-000000000010', 'Beginner', 35, 0, 0, 0, false, false, false, false, false, 'UNVERIFIED')
ON CONFLICT (student_id, skill_id) DO NOTHING;

-- 8. SEED COURSES
INSERT INTO courses (course_id, institution_id, course_name, course_code, description, category, difficulty, duration, hours, instructor, enrolled_count, rating, status) VALUES
('CRS-TN010-01', 'TN010', 'Applied Deep Learning & NLP', 'CS-702-DL', 'Comprehensive transformers, PyTorch implementations, BERT fine-tuning, and production serving architectures.', 'Artificial Intelligence', 'Advanced', '8 Weeks', 24, 'Prof. K. Ramanathan', 184, 4.9, 'ACTIVE'),
('CRS-TN010-02', 'TN010', 'Full-Stack Systems with Go & React', 'CS-504-FS', 'High-throughput microservices, concurrency with Goroutines, gRPC communication, and React 19 client frontends.', 'Systems Engineering', 'Intermediate', '6 Weeks', 18, 'Dr. Aruna Devi', 220, 4.8, 'ACTIVE'),
('CRS-TN001-01', 'TN001', 'Cloud-Native Kubernetes & Microservices', 'IT-801-CN', 'Container orchestration at scale, Istio service mesh, ArgoCD GitOps pipelines, and zero-trust security.', 'Cloud Architecture', 'Advanced', '10 Weeks', 30, 'Dr. M. Shanmugam', 142, 4.9, 'ACTIVE'),
('CRS-TN030-01', 'TN030', 'Autonomous Robotics & ROS 2', 'ROB-601-AU', 'Robot Operating System 2, SLAM navigation, LiDAR point cloud processing, and Gazebo physical simulations.', 'Robotics', 'Advanced', '12 Weeks', 36, 'Dr. V. Radhakrishnan', 98, 4.7, 'ACTIVE'),
('CRS-TN010-03', 'TN010', 'Generative AI & LLM Systems', 'CS-901-GENAI', 'Prompt engineering, RAG with vector databases (ChromaDB / Pinecone), LangChain orchestrations, and local models.', 'Artificial Intelligence', 'Advanced', '6 Weeks', 18, 'Prof. K. Ramanathan', 310, 5.0, 'ACTIVE')
ON CONFLICT (course_id) DO NOTHING;

-- 9. SEED COURSE MODULES
INSERT INTO course_modules (course_id, module_number, module_name, description, duration) VALUES
('CRS-TN010-01', 1, 'Foundations of Neural Networks & Tensor Mathematics', 'Backpropagation, gradient descent variants, PyTorch autograd engine, and tensor manipulation', '3 Hours'),
('CRS-TN010-01', 2, 'Transformer Architecture & Self-Attention Mechanisms', 'Scaled dot-product attention, multi-head mechanisms, positional embeddings, and encoder-decoder topologies', '3 Hours'),
('CRS-TN010-01', 3, 'Pre-training, Masked Language Models & Fine-Tuning', 'BERT, RoBERTa pre-training techniques, Hugging Face Trainer API, and classification head adaptations', '3 Hours'),
('CRS-TN010-01', 4, 'Model Quantization, ONNX Export & Production Serving', 'FP16/INT8 post-training quantization, TorchScript compilation, and FastAPI latency optimization', '3 Hours'),
('CRS-TN010-03', 1, 'Foundations & Architecture of Large Language Models', 'Context windows, tokens, temperature, top-k/top-p sampling, and foundational transformer blocks', '2.5 Hours'),
('CRS-TN010-03', 2, 'Prompt Engineering, System Prompts & Guardrails', 'Few-shot prompting, chain-of-thought, ReAct framework, and output JSON structured schema enforcement', '2.5 Hours'),
('CRS-TN010-03', 3, 'Vector Embeddings, Similarity Search & Indexing', 'Dense text embeddings, cosine similarity, HNSW indexes, ChromaDB and Pinecone implementation', '3 Hours'),
('CRS-TN010-03', 4, 'Retrieval-Augmented Generation (RAG) Architectures', 'Document parsing, chunking strategies, hybrid keyword-vector search, and context groundings', '3 Hours')
ON CONFLICT (course_id, module_number) DO NOTHING;

-- 10. SEED ENROLLMENTS
INSERT INTO enrollments (student_id, course_id, status, progress_percentage, current_module, completed_modules, total_modules, enrolled_at) VALUES
('STU-TN010-001', 'CRS-TN010-01', 'In Progress', 75, 'Module 4: Model Quantization & Serving', 6, 8, NOW() - INTERVAL '24 days'),
('STU-TN010-001', 'CRS-TN010-03', 'In Progress', 85, 'Module 4: Retrieval-Augmented Generation (RAG)', 7, 8, NOW() - INTERVAL '15 days'),
('STU-TN010-002', 'CRS-TN030-01', 'In Progress', 60, 'Module 3: LiDAR SLAM', 5, 12, NOW() - INTERVAL '30 days')
ON CONFLICT (student_id, course_id) DO NOTHING;

-- 11. SEED PROJECTS
INSERT INTO projects (project_id, student_id, institution_id, title, description, github_url, live_url, tech_stack, status, submitted_at, validated_at) VALUES
('PRJ-001', 'STU-TN010-001', 'TN010', 'AI Resume Analyzer & ATS Parser', 'Enterprise ATS parser utilizing fine-tuned NLP pipelines, vector embeddings, and zero-shot keyword extraction with 96% match accuracy against Fortune 500 job descriptions.', 'https://github.com/arunkumar/ai-resume-ats-engine', 'https://ats-analyzer-demo.nexus.app', '["Python", "NLP", "FastAPI", "React", "PostgreSQL"]'::jsonb, 'Validated', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),
('PRJ-002', 'STU-TN010-001', 'TN010', 'Distributed Predictive Churn Engine', 'Production-grade churn prediction engine processing 100K+ transactional events with real-time risk scoring and Kafka stream integration.', 'https://github.com/arunkumar/churn-predictive-eda', 'https://churn-predictor.nexus.app', '["Python", "Pandas", "Scikit-Learn", "PostgreSQL"]'::jsonb, 'Validated', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'),
('PRJ-003', 'STU-TN010-002', 'TN010', 'Edge AI Vision System for Industrial Defect Detection', 'MicroPython & TinyML vision module running on ESP32-CAM with inference latency under 80ms for real-time assembly line anomaly discovery.', 'https://github.com/priyasundaram/edge-ai-tinyml', 'https://edge-defect.srm.edu.in', '["C++", "TinyML", "ESP32", "Edge AI"]'::jsonb, 'Validated', NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days')
ON CONFLICT (project_id) DO NOTHING;

-- 12. SEED PROJECT PROOFS (Sovereign Ledger)
INSERT INTO project_proofs (project_id, proof_hash, git_commit_hash, test_pass_percentage, code_quality_score, faculty_id, faculty_signature, verification_status, ledger_block, submitted_at, verified_at) VALUES
('PRJ-001', '0x94f8128bc91a782b10a9c84e1823019f823a78bc', 'c8a91f3', 96.0, 94.5, 'Prof. K. Ramanathan', 'SIG_COE_SRM_9821_OCT24', 'Validated', 'Block #8941_301', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),
('PRJ-002', '0x8821bc109b4317a8029c738192a40b912384a8bc', 'a41f89e', 98.2, 92.0, 'Prof. K. Ramanathan', 'SIG_COE_SRM_4412_SEP24', 'Validated', 'Block #8930_118', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'),
('PRJ-003', '0x7719ab331e90218bc194a821738290bc91823a10', 'f9012cd', 99.1, 96.0, 'Prof. K. Ramanathan', 'SIG_COE_SRM_6120_NOV24', 'Validated', 'Block #8945_402', NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days')
ON CONFLICT (project_id) DO NOTHING;

-- 13. SEED OPPORTUNITIES
INSERT INTO opportunities (opportunity_id, company_id, title, description, opportunity_type, location, work_mode, experience_level, salary_min, salary_max, stipend_text, application_deadline, required_skills, applicant_count, status) VALUES
('OPP-001', 'COMP-001', 'Data Analyst Intern', 'Analyze high-velocity client telemetry data, build automated executive dashboards, and implement SQL/Python predictive pipelines for enterprise clients.', 'Internship', 'Chennai, Tamil Nadu (Hybrid)', 'Hybrid', 'Fresher / Entry Level', 35000, 45000, '₹35,000 / month', CURRENT_DATE + INTERVAL '21 days', '["Python", "SQL", "Machine Learning", "Power BI"]'::jsonb, 42, 'ACTIVE'),
('OPP-002', 'COMP-002', 'Cloud DevOps Intern', 'Build and maintain automated CI/CD pipelines, containerize backend microservices with Docker, and orchestrate deployments on AWS Kubernetes clusters.', 'Internship', 'Bengaluru, Karnataka (Remote)', 'Remote', 'Fresher / Entry Level', 40000, 55000, '₹45,000 / month', CURRENT_DATE + INTERVAL '35 days', '["Docker", "Linux", "AWS", "Python", "CI/CD"]'::jsonb, 68, 'ACTIVE'),
('OPP-003', 'COMP-003', 'AI Systems Research Intern', 'Implement retrieval-augmented generation (RAG) engines, benchmark open-weight LLMs, and optimize inference latency using vLLM and TensorRT-LLM.', 'Internship', 'Mumbai / Hybrid', 'Hybrid', 'Entry Level', 50000, 65000, '₹55,000 / month', CURRENT_DATE + INTERVAL '14 days', '["Python", "Generative AI", "RAG", "FastAPI", "Vector DB"]'::jsonb, 29, 'ACTIVE'),
('OPP-004', 'COMP-004', 'Full Stack Engineer', 'Design and scale cloud-native web applications using modern React, TypeScript, Node.js microservices, and PostgreSQL database layers.', 'Full-Time', 'Chennai / Bengaluru', 'Hybrid', '0-2 Years', 75000, 95000, '₹10,00,000 - ₹14,00,000 / annum', CURRENT_DATE + INTERVAL '45 days', '["React", "JavaScript", "Python", "PostgreSQL", "Docker"]'::jsonb, 115, 'ACTIVE')
ON CONFLICT (opportunity_id) DO NOTHING;

-- 14. SEED APPLICATIONS
INSERT INTO applications (application_id, student_id, opportunity_id, company_id, match_score, status, recruiter_action, applied_at) VALUES
('APP-001', 'STU-TN010-001', 'OPP-001', 'COMP-001', 92, 'Shortlisted', 'Shortlisted for Round 1 Technical Interview • Passport Verified', NOW() - INTERVAL '3 days'),
('APP-002', 'STU-TN010-001', 'OPP-002', 'COMP-002', 86, 'Applied', 'Candidate in Initial Automated Screening Queue', NOW() - INTERVAL '1 day')
ON CONFLICT (student_id, opportunity_id) DO NOTHING;

-- 15. SEED MATCH RESULTS (Deterministic 4-Pillar NEXUS AI Engine)
INSERT INTO match_results (student_id, opportunity_id, overall_score, skill_match, project_fit, assessment_score, career_alignment, explanation) VALUES
('STU-TN010-001', 'OPP-001', 92, 94, 91, 88, 95, '{"strengths": ["Python 94% verified", "SQL 88% verified", "ATS Project validated by faculty"], "gaps": ["Power BI is at beginner level (35%)"], "recommendation": "High candidate suitability with 92% composite alignment. Express Fast-Track recommended."}'::jsonb),
('STU-TN010-001', 'OPP-002', 86, 82, 85, 88, 90, '{"strengths": ["Python 94% verified", "Code Quality 94.5%"], "gaps": ["Docker experience is beginner (58%)"], "recommendation": "Candidate meets Tier-1 threshold. Recommend Docker sprint completion."}'::jsonb)
ON CONFLICT (student_id, opportunity_id) DO NOTHING;

-- 16. SEED NOTIFICATIONS (Role-Isolated with Soft Delete & Trash Bin Support)
INSERT INTO notifications (notification_id, recipient_type, recipient_id, notification_type, title, message, related_entity_type, related_entity_id, is_read, is_deleted, created_at, details) VALUES
('notif_01', 'student', 'STU-TN010-001', 'high_match', 'New High-Match Internship', 'ABC Technologies posted Data Analyst Intern matching 92% of your verified competencies.', 'opportunity', 'OPP-001', false, false, NOW() - INTERVAL '2 hours', '{"matchPercentage": 92, "company": "ABC Technologies", "role": "Data Analyst Intern", "compensation": "₹35,000 / month", "action": "opportunities"}'::jsonb),
('notif_02', 'student', 'STU-TN010-001', 'project_validated', 'Project Proof Validated', 'Your "AI Resume Analyzer & ATS Parser" project was verified and sealed to your Digital Passport.', 'project', 'PRJ-001', false, false, NOW() - INTERVAL '5 hours', '{"project": "AI Resume Analyzer & ATS Parser", "proctorHash": "0x94f8128bc91a782b", "action": "projects"}'::jsonb),
('notif_03', 'student', 'STU-TN010-001', 'course_reminder', 'Course Reminder', 'You have an unfinished module in "Generative AI & LLM Systems". Complete today to maintain your streak!', 'course', 'CRS-TN010-03', true, false, NOW() - INTERVAL '2 days', '{"course": "Generative AI & LLM Systems", "action": "learning"}'::jsonb),
('inst_notif_01', 'institution', 'TN010', 'high_match_student', 'High-Match Student Identified', 'Arun Kumar (B.Tech CSE) achieved 92% match for Data Analyst Intern at ABC Technologies.', 'student', 'STU-TN010-001', false, false, NOW() - INTERVAL '3 hours', '{"student": "Arun Kumar", "action": "institution-students"}'::jsonb),
('inst_notif_02', 'institution', 'TN010', 'proof_required', 'Project Proof Attestation Needed', '1 student capstone submission is awaiting faculty signature on the Sovereign Ledger.', 'project', 'PRJ-003', false, false, NOW() - INTERVAL '6 hours', '{"pendingCount": 1, "action": "institution-proofs"}'::jsonb),
('comp_notif_01', 'company', 'COMP-001', 'application_received', 'New Verified Candidate Application', 'Arun Kumar applied for Data Analyst Intern with 92% NEXUS Match and validated Sovereign Ledger proof.', 'application', 'APP-001', false, false, NOW() - INTERVAL '1 hour', '{"candidate": "Arun Kumar", "matchScore": 92, "action": "applications"}'::jsonb)
ON CONFLICT (notification_id) DO NOTHING;
