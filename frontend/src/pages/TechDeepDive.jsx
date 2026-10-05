import React from 'react';
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
  Heart,
  DollarSign,
  Code,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { openGoogleResearch } from '../utils/googleResearch';

export default function TechDeepDive({ setActivePage }) {
  const domains = [
    {
      title: "Healthcare",
      icon: Heart,
      color: "var(--cyber-rose)",
      desc: "Accelerated drug discovery, protein folding synthesis, and clinical report summarization with clinical grounding.",
      adoption: "High Growth"
    },
    {
      title: "Finance",
      icon: DollarSign,
      color: "var(--cyber-emerald)",
      desc: "Algorithmic risk modeling, real-time SEC AI document extraction, fraud synthetic pattern detection, and autonomous KYC.",
      adoption: "Very High"
    },
    {
      title: "Software Engineering",
      icon: Code,
      color: "var(--cyber-cyan)",
      desc: "Autonomous coding agents, copilot integration, synthesized unit tests, and continuous PR remediation.",
      adoption: "Mission Critical"
    },
    {
      title: "Enterprise Knowledge",
      icon: Database,
      color: "var(--cyber-purple)",
      desc: "Dense vector semantic retrieval, context-aware policy reasoning, and live knowledge base Q&A.",
      adoption: "Universal"
    }
  ];

  const jobRoles = [
    { role: "AI Engineer", salary: "$125K - $180K", match: "82%", desc: "Builds and deploys responsive production inference pipelines." },
    { role: "Machine Learning Engineer", salary: "$120K - $175K", match: "80%", desc: "Optimizes model quantization, fine-tuning, and scalable distributed training." },
    { role: "Prompt & LLM Systems Eng", salary: "$110K - $155K", match: "75%", desc: "Specializes in guardrails, structured JSON output extraction, multi-step agents." },
    { role: "Data Scientist (GenAI Focus)", salary: "$115K - $165K", match: "72%", desc: "Evaluates hallucination rates, contextual vector retrieval experiments, and synthetic data." }
  ];

  const skillGaps = [
    { name: "Python Architecture", user: 84, target: 90, gap: "-6% Minor Gap", status: "good" },
    { name: "Deep Learning Fundamentals", user: 68, target: 85, gap: "-17% Moderate Gap", status: "warn" },
    { name: "Large Language Models & Prompting", user: 45, target: 88, gap: "-43% Target Gap", status: "critical" },
    { name: "Vector DBs & RAG Architecture", user: 40, target: 80, gap: "-40% Open Gap", status: "critical" }
  ];

  return (
    <div>
      {/* Back Link */}
      <button
        onClick={() => setActivePage('advanced-tech')}
        style={{
          background: 'none', border: 'none', color: 'var(--cyber-cyan)',
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Advanced Technologies</span>
      </button>

      {/* Top Deep Dive Hero matching Page 7 */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: '32px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="cyber-badge badge-cyan">DEEP DIVE // EMERGING RADAR #01</span>
              <span className="cyber-badge badge-purple">High Industry Demand</span>
            </div>
            <button
              onClick={() => openGoogleResearch('Generative AI', { category: 'Artificial Intelligence', focus: 'fundamentals and industry architecture' })}
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: 'var(--cyber-cyan)',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Research Generative AI on Google"
            >
              <span>Research on Google</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Generative AI
          </h1>
          <div style={{ fontSize: '14px', color: 'var(--cyber-cyan)', fontWeight: 600, marginBottom: '12px' }}>
            Create, Innovate, Transform.
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', maxWidth: '640px' }}>
            Generative AI refers to foundation models and neural architectures capable of synthesizing high-fidelity text, code, imagery, audio, and structured reasoning from complex prompts.
          </p>

          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>HIRING VELOCITY</span>
              <div style={{ color: 'var(--cyber-emerald)', fontWeight: 700, fontSize: '15px' }}>+312% YoY</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>JOB POSTINGS</span>
              <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px' }}>14,280+</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>MARKET FRICTION</span>
              <div style={{ color: 'var(--cyber-amber)', fontWeight: 700, fontSize: '15px' }}>Moderate-High</div>
            </div>
          </div>
        </div>

        {/* Personalized Readiness Ring */}
        <div style={{
          padding: '20px', borderRadius: '12px',
          background: 'var(--bg-input)', border: '1px solid var(--border-glow)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
            Personalized Readiness
          </span>

          <div style={{
            width: '90px', height: '90px', borderRadius: '50%',
            background: 'radial-gradient(circle, #0F1A30 60%, rgba(139,92,246,0.2) 100%)',
            border: '3px solid var(--cyber-purple)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--cyber-purple-glow)', marginBottom: '10px'
          }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              38%
            </span>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Current Match: <strong>38%</strong> • Benchmark: <strong style={{ color: 'var(--cyber-cyan)' }}>75%</strong>
          </div>

          <button
            onClick={() => setActivePage('enroll')}
            className="btn-cyber-primary"
            style={{ width: '100%', padding: '8px', fontSize: '12px', marginTop: '12px' }}
          >
            Bridge Readiness Gap
          </button>
        </div>
      </div>

      {/* System Architecture Banner matching Page 7 */}
      <div className="glass-panel" style={{
        padding: '22px 28px', marginBottom: '24px',
        background: 'var(--bg-card)'
      }}>
        <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
          SYSTEM ARCHITECTURE
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          High-Dimensional Latent Synthesizers & Multi-Agent Graphs
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Observe generative AI transitioning from experimental chat interfaces into autonomous software execution fabrics, accelerated reasoning loops, and zero-shot multimodal intelligence.
        </p>
      </div>

      {/* Why It Matters: 4 Domain Cards Grid matching Page 7 */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Why It Matters & Where It's Used
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {domains.map((dom, idx) => {
            const Icon = dom.icon;
            return (
              <div key={idx} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: dom.color
                  }}>
                    <Icon size={18} />
                  </div>
                  <span className="cyber-badge" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)' }}>
                    {dom.adoption}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {dom.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {dom.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Market Demand & Top Job Roles */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Market Demand & Top Job Roles
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {jobRoles.map((role, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{role.role}</h4>
                <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>Match {role.match}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyber-emerald)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                {role.salary}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {role.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Breakdown: You vs. Industry Benchmark matching Page 7 */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Skills Breakdown: You vs. Industry Benchmark
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Comparative analysis between your verified ledger proficiencies and Tier-1 employer requisitions.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {skillGaps.map((item, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                <span style={{
                  fontSize: '11px',
                  color: item.status === 'good' ? 'var(--cyber-emerald)' : (item.status === 'warn' ? 'var(--cyber-amber)' : 'var(--cyber-rose)'),
                  fontFamily: 'var(--font-mono)', fontWeight: 600
                }}>
                  {item.gap}
                </span>
              </div>

              {/* Dual Bar Comparison */}
              <div style={{ position: 'relative', width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Industry Target Marker */}
                <div style={{
                  position: 'absolute', top: 0, left: `${item.target}%`, width: '2px', height: '100%',
                  background: '#FFF', zIndex: 2
                }}></div>
                {/* User Current Fill */}
                <div style={{
                  width: `${item.user}%`, height: '100%',
                  background: item.status === 'good' ? 'var(--cyber-cyan)' : (item.status === 'warn' ? 'var(--cyber-amber)' : 'var(--cyber-rose)'),
                  borderRadius: '4px'
                }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>You: {item.user}%</span>
                <span>Industry Target: {item.target}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Roadmap: Close the Gaps matching Page 7 */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Actionable Roadmap: Close the Gaps
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="cyber-badge badge-cyan" style={{ fontSize: '9px', marginBottom: '8px' }}>STEP 1 • COURSE</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
                Generative AI Fundamentals
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--cyber-purple)', marginBottom: '10px' }}>
                Curated by NEXUS AI + ScaleAI Labs
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Learn foundation models, transformer architectures, token embeddings, and fine-tuning mechanics with industry-graded labs.
              </p>
            </div>
            <button
              onClick={() => setActivePage('enroll')}
              className="btn-cyber-primary"
              style={{ width: '100%', padding: '9px', fontSize: '12.5px' }}
            >
              Enroll / View Course →
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="cyber-badge badge-purple" style={{ fontSize: '9px', marginBottom: '8px' }}>STEP 2 • PROJECT</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
                Enterprise Chatbot with LLM + RAG
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--cyber-cyan)', marginBottom: '10px' }}>
                Nexus Sandbox Pro Blueprint
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Deploy an end-to-end retrieval-augmented generation pipeline: ingest internal documentation, index dense embeddings, and run latency evaluations.
              </p>
            </div>
            <button
              onClick={() => setActivePage('projects')}
              className="btn-cyber-purple"
              style={{ width: '100%', padding: '9px', fontSize: '12.5px' }}
            >
              Launch Project Sandbox →
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="cyber-badge badge-emerald" style={{ fontSize: '9px', marginBottom: '8px' }}>STEP 3 • TARGET ROLE</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', marginBottom: '4px' }}>
                TechCorp AI Intern
              </h4>
              <div style={{ fontSize: '11px', color: 'var(--cyber-emerald)', marginBottom: '10px' }}>
                High Fit Probability • 92% Match
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Focus on prompt engineering, evaluation metrics, and multi-node inference acceleration.
              </p>
            </div>
            <button
              onClick={() => setActivePage('opportunities')}
              style={{
                width: '100%', padding: '9px', fontSize: '12.5px',
                background: 'var(--cyber-emerald)', color: '#060B14',
                fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer'
              }}
            >
              Preview Opportunity →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
