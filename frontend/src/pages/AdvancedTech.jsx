import React, { useState } from 'react';
import {
  Cpu,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  Shield,
  Layers,
  Activity,
  ExternalLink
} from 'lucide-react';
import { openGoogleResearch } from '../utils/googleResearch';

export default function AdvancedTech({ setActivePage }) {
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'Trending',
    'AI & ML',
    'Cloud & Distributed',
    'Web3 & Decentralized',
    'Cybersecurity',
    'Emerging & Quantum'
  ];

  const technologies = [
    {
      id: "tech_01",
      title: "Generative AI",
      tags: ["LLM / DIFFUSION / MULTIMODAL"],
      description: "Foundation models, LLM architectures, diffusion models, and multimodal synthesis.",
      industryDemand: 98,
      difficulty: "Intermediate",
      rating: "5.0 / 5.0",
      status: "In Progress (Enrolled • 42%)",
      statusClass: "badge-cyan",
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
      statusClass: "badge-purple",
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
      statusClass: "badge-emerald",
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
      statusClass: "badge-cyan",
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
      statusClass: "badge-purple",
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
      statusClass: "badge-amber",
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
      statusClass: "badge-cyan",
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
      statusClass: "badge-emerald",
      slug: "robotics-ros2",
      category: "Emerging & Quantum"
    }
  ];

  const filteredTechs = technologies.filter(tech => {
    if (activeCategory === 'Trending' && !tech.isTrending) return false;
    if (activeCategory !== 'Trending' && tech.category !== activeCategory) return false;
    if (searchQuery && !tech.title.toLowerCase().includes(searchQuery.toLowerCase()) && !tech.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      {/* Header Telemetry */}
      <div className="page-top-telemetry">
        <div className="page-title-group">
          <div className="telemetry-node-tag">
            <span>06 // TECH FRONTIER RADAR</span>
            <span>•</span>
            <span>LIVE TELEMETRY</span>
          </div>
          <h1>Advanced Technologies</h1>
          <p>Explore what's next. Build skills before the industry demands them with deep-market synthesis.</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
          fontSize: '11.5px', fontFamily: 'var(--font-mono)'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>TARGET PROFILE:</span>
          <strong style={{ color: 'var(--cyber-cyan)' }}>Active Learning Cohort</strong>
        </div>
      </div>

      {/* Algorithmic Industry Velocity Card matching Page 6 */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '28px',
        background: 'var(--bg-card)',
        borderColor: 'rgba(56, 189, 248, 0.25)',
        display: 'grid',
        gridTemplateColumns: '1fr 240px',
        gap: '24px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--cyber-cyan)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyber-cyan)' }}></span>
            <span>EMERGING TECH RADAR 2025</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Algorithmic Industry Velocity
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', maxWidth: '640px' }}>
            Synthesized across real-time hiring requisitions, seed venture investments, and enterprise commit velocity.
          </p>

          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Inferred <strong style={{ color: 'var(--cyber-emerald)' }}>14,200+</strong> industry job descriptions this week. • <span style={{ color: 'var(--cyber-cyan)' }}>ST Enterprise Skill Synced</span>
          </div>
        </div>

        {/* Frontier Readiness Gauge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px', borderRadius: '12px', background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)', textAlign: 'center'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'radial-gradient(circle, #0B172E 60%, rgba(0,212,255,0.2) 100%)',
            border: '3px solid var(--cyber-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', boxShadow: 'var(--cyber-cyan-glow)',
            marginBottom: '8px'
          }}>
            82%
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Frontier Readiness
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--cyber-cyan)' }}>
            Ahead of 78% Peers
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
        borderRadius: '10px', padding: '10px 16px', marginBottom: '16px'
      }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search emerging technologies, frameworks, domains (e.g., Multi-Agent, NeRF, TensorRT)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%'
          }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌘K</span>
      </div>

      {/* Filter Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeCategory === cat ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
              border: activeCategory === cat ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 8 Tech Cards Grid matching Page 6 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {technologies.map((tech) => (
          <div
            key={tech.id}
            className="glass-panel"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="code-font" style={{ fontSize: '10px', color: 'var(--cyber-cyan)', letterSpacing: '0.05em' }}>
                  {tech.tags[0]}
                </span>
                {tech.isTrending && (
                  <span className="cyber-badge badge-cyan" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Trending
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {tech.title}
              </h3>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                {tech.description}
              </p>

              {/* Demand & Difficulty */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Industry Demand</span>
                  <strong style={{ color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)' }}>{tech.industryDemand}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Diff: {tech.difficulty}</span>
                  <span style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)' }}>★ {tech.rating}</span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {tech.status}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => {
                  if (tech.slug === 'generative-ai') {
                    setActivePage('advanced-tech-deepdive');
                  } else {
                    setActivePage('advanced-tech-deepdive');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cyber-cyan)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 0'
                }}
              >
                <span>Learn More →</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openGoogleResearch(tech.title, {
                    category: tech.category,
                    focus: 'learning roadmap and documentation'
                  });
                }}
                title={`Research ${tech.title} on Google`}
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: 'var(--cyber-cyan)',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Google</span>
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nexus Tech Forecast Banner matching Page 6 bottom */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--grad-purple-indigo)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#FFF'
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--cyber-purple)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 700 }}>
              NEXUS TECH FORECAST • Empirical Placement Data
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600 }}>
              Students with 2+ validated emerging technologies see a <strong>3.4x higher interview callback rate</strong> in data science and frontier engineering roles.
            </div>
          </div>
        </div>

        <button
          onClick={() => setActivePage('enroll')}
          className="btn-cyber-primary"
          style={{ padding: '9px 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          Enroll in Emerging Cohort →
        </button>
      </div>
    </div>
  );
}
