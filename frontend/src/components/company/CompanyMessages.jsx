import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  ShieldCheck,
  ArrowLeft,
  Eye,
  Clock,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import { messageService } from '../../services/messageService';
import '../common/CompactDataList.css';

export default function CompanyMessages({ user, initialStudent = null, onShowToast }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [inputText, setInputText] = useState('');
  const [searchConvQuery, setSearchConvQuery] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messageService.getConversations();
      if (res && res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !activeConvId) {
          setActiveConvId(res.conversations[0].id);
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.warn('Company conversations fetch note:', err.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Handle initial candidate passed from profile
  useEffect(() => {
    if (initialStudent) {
      const existing = conversations.find(c => c.id === initialStudent.id || c.title?.includes(initialStudent.name));
      if (existing) {
        setActiveConvId(existing.id);
        setViewMode('chat');
      } else {
        // Create draft thread
        const handleNewThread = async () => {
          try {
            const res = await messageService.createConversation({
              title: `Direct Outreach: ${initialStudent.name || 'Candidate'}`,
              participantEmail: initialStudent.email,
              initialMessage: `Hello ${initialStudent.name || 'Candidate'}, we reviewed your skills profile and are interested in discussing opportunities at our organization!`
            });
            if (res && res.success && res.conversation) {
              await loadConversations();
              setActiveConvId(res.conversation.id);
              setViewMode('chat');
            }
          } catch (e) {
            console.warn('Auto thread creation note:', e.message);
          }
        };
        handleNewThread();
      }
    }
  }, [initialStudent]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }
    let isMounted = true;
    const fetchMsgs = async () => {
      setMessagesLoading(true);
      try {
        const res = await messageService.getMessages(activeConvId);
        if (isMounted) {
          if (res && res.success && Array.isArray(res.messages)) {
            setMessages(res.messages);
          } else {
            setMessages([]);
          }
        }
      } catch (err) {
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setMessagesLoading(false);
      }
    };
    fetchMsgs();
    return () => { isMounted = false; };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const filteredConversations = conversations.filter(c => {
    if (!searchConvQuery.trim()) return true;
    const q = searchConvQuery.toLowerCase();
    return (c.title || '').toLowerCase().includes(q) || (c.last_message || c.lastMessage || '').toLowerCase().includes(q);
  });

  const openConversationDetail = (id) => {
    setActiveConvId(id);
    setViewMode('chat');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await messageService.sendMessage(activeConvId, textToSend);
      if (res && res.success && res.message) {
        setMessages(prev => [...prev, res.message]);
      } else {
        const refresh = await messageService.getMessages(activeConvId);
        if (refresh && refresh.success && Array.isArray(refresh.messages)) {
          setMessages(refresh.messages);
        }
      }
      if (onShowToast) {
        onShowToast({
          title: 'Message Dispatched',
          message: 'Message transmitted securely to candidate channel.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Failed to send company message:', err);
      if (onShowToast) {
        onShowToast({
          title: 'Transmission Error',
          message: err.message || 'Unable to deliver message.',
          type: 'error'
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--cyber-cyan)" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Direct Recruiter Messages</h1>
            <span className="cyber-badge badge-cyan" style={{ fontSize: '10px' }}>SECURE CHANNEL</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Verified candidate outreach, communication audit trail, and recruitment coordination across partner colleges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'chat' ? (
            <button
              onClick={() => setViewMode('list')}
              className="btn-cyber-outline"
              style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Conversations List</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchConvQuery}
                  onChange={(e) => setSearchConvQuery(e.target.value)}
                  className="company-input w-full text-xs"
                  style={{ paddingLeft: '32px' }}
                />
              </div>
              <button
                onClick={loadConversations}
                disabled={loading}
                className="btn-cyber-outline"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                title="Refresh messages"
              >
                <RefreshCw size={13} className={loading ? 'spin' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── VIEW 1: COMPACT LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="compact-table-container" style={{ marginBottom: '28px' }}>
          <div className="compact-table-scroll">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Conversation Thread</th>
                  <th style={{ width: '40%' }}>Latest Message</th>
                  <th style={{ width: '13%' }}>Timestamp</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <div className="spinner" style={{ margin: '0 auto 8px', width: '22px', height: '22px' }} />
                      Loading candidate conversations...
                    </td>
                  </tr>
                ) : filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                      <MessageSquare size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No messages yet.
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        When you contact candidates or candidates apply to your openings, active chat threads will appear here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((conv) => (
                    <tr
                      key={conv.id}
                      onClick={() => openConversationDetail(conv.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--cyber-purple)'
                          }}>
                            <MessageSquare size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="compact-cell-title">{conv.title || 'Candidate Thread'}</span>
                              <ShieldCheck size={13} color="var(--cyber-cyan)" />
                            </div>
                            <div className="compact-cell-sub">ID: {conv.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.last_message || conv.lastMessage || 'Conversation opened'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          <Clock size={11} /> {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'Active'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConversationDetail(conv.id);
                          }}
                          className="btn-compact-details"
                        >
                          <Eye size={12} />
                          <span>Open Chat →</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW 2: DEDICATED DETAILED CHAT VIEW ── */}
      {viewMode === 'chat' && (
        <div className="company-card p-0 grid grid-cols-1 md:grid-cols-12 h-[620px] overflow-hidden">
          {/* Left: Conversation Switcher */}
          <div className="md:col-span-4 border-r border-white/5 flex flex-col h-full bg-[#091122]">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Threads ({conversations.length})
              </span>
              <button
                onClick={() => setViewMode('list')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Compact List
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No messages yet.
                </div>
              ) : (
                conversations.map(conv => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                        isActive ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white text-xs truncate">{conv.title || 'Candidate Thread'}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-1">{conv.last_message || conv.lastMessage || 'Active thread'}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Chat Window */}
          <div className="md:col-span-8 flex flex-col h-full bg-[#0D172B]">
            {activeConv ? (
              <>
                <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-[#0A1428]">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{activeConv.title || 'Recruitment Chat'}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Encrypted Candidate Outreach Channel
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      Secure
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="btn-cyber-outline"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Close Chat
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <div className="text-center text-slate-400 text-xs py-8">
                      <div className="spinner" style={{ margin: '0 auto 8px', width: '20px', height: '20px' }} />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-12">
                      <MessageSquare size={28} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                      <div className="font-semibold text-white mb-1">No messages in this thread yet.</div>
                      <div>Type a message below to initiate the communication.</div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender_user_id === user?.id || msg.sender_user_id === user?.userId || msg.senderRole === 'company' || msg.sender === 'recruiter';
                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-cyan-500/20 text-cyan-50 border border-cyan-500/30 rounded-br-none'
                              : 'bg-white/5 text-slate-200 border border-white/5 rounded-bl-none'
                          }`}>
                            {msg.message_text || msg.text || msg.content}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                            <span>{msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-cyan-400" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-[#0A1428] flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type candidate message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="company-input flex-1 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="btn-cyber-primary"
                    style={{ padding: '8px 14px', fontSize: '12px', opacity: (!inputText.trim() || sending) ? 0.6 : 1 }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="m-auto text-center text-slate-400 p-8">
                <MessageSquare size={36} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                <div className="font-bold text-white text-sm mb-1">No conversation selected</div>
                <div className="text-xs">Select a conversation thread from the left.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
