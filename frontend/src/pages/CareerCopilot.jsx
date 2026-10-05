import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
  TrendingUp,
  Brain,
  Award,
  BookOpen,
  Briefcase,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Target,
  ArrowRight
} from 'lucide-react';
import { careerCopilotService } from '../services/careerCopilotService';

export default function CareerCopilot({ setActivePage, onShowToast, user }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([
    "What skills should I improve?",
    "Am I ready for this internship?",
    "What should I learn next?",
    "Why is my match score low?",
    "Which opportunities fit my profile?"
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history or welcome message on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const history = await careerCopilotService.getHistory();
        if (history && history.length > 0) {
          setMessages(history.map(item => ({
            id: item.id || `msg_${Math.random()}`,
            role: item.role,
            content: item.content,
            metadata: item.metadata,
            timestamp: item.timestamp || new Date().toISOString()
          })));
        } else {
          // Welcome greeting
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Hello ${user?.name || user?.fullName || 'Student'}! 👋\n\nI am your **Skill Nexus AI Career Copilot**. I analyze your verified skills, course completions, diagnostic benchmarks, and project credentials to provide deterministic, grounded career navigation.\n\nHow can I accelerate your professional development today?`,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        console.warn('[CareerCopilot] Initial load notice:', err.message);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your **Skill Nexus AI Career Copilot**. Ask me anything about your skills, readiness score, target job roles, or course recommendations!`,
            timestamp: new Date().toISOString()
          }
        ]);
      } finally {
        setInitialLoading(false);
      }
    }
    loadInitial();
  }, [user]);

  // Send message handler
  const handleSend = async (customQuery = null) => {
    const query = (customQuery || inputText).trim();
    if (!query || loading) return;

    const userMessageId = `user_${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMessageId, role: 'user', content: query, timestamp: new Date().toISOString() }
    ];
    setMessages(newMessages);
    if (!customQuery) setInputText('');
    setLoading(true);

    try {
      const response = await careerCopilotService.sendMessage(query);
      if (response && response.reply) {
        setMessages([
          ...newMessages,
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: response.reply,
            structuredData: response.structuredData,
            disclaimer: response.disclaimer,
            timestamp: new Date().toISOString()
          }
        ]);
        if (Array.isArray(response.suggestions) && response.suggestions.length > 0) {
          setSuggestions(response.suggestions);
        }
      }
    } catch (err) {
      console.error('[CareerCopilot] Send error:', err);
      setMessages([
        ...newMessages,
        {
          id: `ai_err_${Date.now()}`,
          role: 'assistant',
          isError: true,
          content: `⚠️ I encountered an issue retrieving your platform intelligence. Please ensure you are logged in and try again: ${err.message}`,
          timestamp: new Date().toISOString()
        }
      ]);
      if (onShowToast) onShowToast('Failed to reach Career Copilot. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation handler
  const handleClear = async () => {
    if (!window.confirm('Clear your conversation with AI Career Copilot?')) return;
    try {
      await careerCopilotService.clearHistory();
      setMessages([
        {
          id: 'cleared_welcome',
          role: 'assistant',
          content: `Conversation cleared. What career goal or skill competency would you like to review next?`,
          timestamp: new Date().toISOString()
        }
      ]);
      setSuggestions([
        "What skills should I improve?",
        "Am I ready for this internship?",
        "What should I learn next?",
        "Why is my match score low?"
      ]);
      if (onShowToast) onShowToast('Chat conversation cleared', 'info');
    } catch (e) {
      if (onShowToast) onShowToast('Could not clear conversation', 'error');
    }
  };

  // Quick navigation helpers
  const handleQuickNav = (page) => {
    if (setActivePage) setActivePage(page);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 90px)',
      boxSizing: 'border-box'
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
          }}>
            <Bot size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                AI Career Copilot
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#6366F1',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                Live AI
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Grounded, verifiable career advising backed by your platform profile & benchmarks
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => handleQuickNav('career-journey')}
            className="btn-cyber-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <TrendingUp size={15} /> Career Journey →
          </button>
          <button
            onClick={handleClear}
            className="btn-cyber-secondary"
            title="Clear Chat History"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={15} /> Clear
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div style={{
        flex: 1,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
      }}>
        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div style={{
                  maxWidth: '82%',
                  minWidth: '200px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '14px 18px',
                  background: isUser
                    ? 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)'
                    : 'var(--bg-elevated, rgba(255,255,255,0.03))',
                  color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: isUser
                    ? '0 4px 14px rgba(79, 70, 229, 0.25)'
                    : '0 2px 8px rgba(0,0,0,0.02)',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  wordBreak: 'break-word'
                }}>
                  {/* Content with basic bold & newline formatting */}
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {msg.content}
                  </div>

                  {/* Structured Data View (e.g. Recommendations, Gaps) */}
                  {msg.structuredData && (
                    <div style={{
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {/* Strong Skills */}
                      {Array.isArray(msg.structuredData.strongSkills) && msg.structuredData.strongSkills.length > 0 && (
                        <div style={{ fontSize: '12.5px' }}>
                          <span style={{ color: '#10B981', fontWeight: '700' }}>✓ Verified Strengths: </span>
                          <span>{msg.structuredData.strongSkills.join(', ')}</span>
                        </div>
                      )}

                      {/* Improvement Gaps */}
                      {Array.isArray(msg.structuredData.improvementSkills) && msg.structuredData.improvementSkills.length > 0 && (
                        <div style={{ fontSize: '12.5px' }}>
                          <span style={{ color: '#F59E0B', fontWeight: '700' }}>⚠ Priority Gaps: </span>
                          <span>{msg.structuredData.improvementSkills.join(', ')}</span>
                        </div>
                      )}

                      {/* Recommended Courses */}
                      {Array.isArray(msg.structuredData.recommendedCourses) && (
                        <div style={{ marginTop: '6px' }}>
                          <button
                            onClick={() => handleQuickNav('learning')}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid #6366F1',
                              color: '#6366F1',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <BookOpen size={14} /> Open Course Catalog →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disclaimer banner if provided */}
                  {msg.disclaimer && (
                    <div style={{
                      marginTop: '10px',
                      fontSize: '11px',
                      color: 'var(--text-tertiary, #9CA3AF)',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <HelpCircle size={12} /> {msg.disclaimer}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary, #374151)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                    marginTop: '2px',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Bot size={18} />
              </div>
              <div style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px 16px 16px 4px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}>
                <Sparkles size={16} className="animate-spin" color="#6366F1" />
                Copilot is analyzing your verified skills & platform credentials...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none'
        }}>
          {suggestions.map((sug, index) => (
            <button
              key={index}
              disabled={loading}
              onClick={() => handleSend(sug)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12.5px',
                color: 'var(--text-primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.borderColor = '#6366F1';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <Sparkles size={12} color="#6366F1" />
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={inputText}
            disabled={loading}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Copilot about your skills, readiness score, job eligibility..."
            style={{
              flex: 1,
              background: 'var(--bg-primary, rgba(0,0,0,0.03))',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            style={{
              background: inputText.trim() && !loading ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'var(--border-subtle)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
              boxShadow: inputText.trim() && !loading ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
            }}
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
