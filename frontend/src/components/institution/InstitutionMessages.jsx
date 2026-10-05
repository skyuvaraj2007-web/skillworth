import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Building,
  GraduationCap,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  Plus,
  CheckCircle2,
  X
} from 'lucide-react';
import { messageService } from '../../services/messageService';

export default function InstitutionMessages({ institution, onShowToast }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messageService.getConversations();
      if (res && res.success && Array.isArray(res.conversations)) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !activeConversation) {
          setActiveConversation(res.conversations[0]);
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation || !activeConversation.id) {
      setMessages([]);
      return;
    }
    let isMounted = true;
    const fetchMsgs = async () => {
      setMessagesLoading(true);
      try {
        const res = await messageService.getMessages(activeConversation.id);
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
  }, [activeConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const res = await messageService.sendMessage(activeConversation.id, textToSend);
      if (res && res.success && res.message) {
        setMessages(prev => [...prev, res.message]);
      } else {
        // Reload messages to be sure
        const refreshRes = await messageService.getMessages(activeConversation.id);
        if (refreshRes && refreshRes.success && Array.isArray(refreshRes.messages)) {
          setMessages(refreshRes.messages);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      if (onShowToast) {
        onShowToast({
          title: 'Message Error',
          message: err.message || 'Unable to deliver message.',
          type: 'error'
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await messageService.createConversation({
        title: newTitle.trim(),
        participantEmail: newParticipantEmail.trim() || undefined,
        initialMessage: newInitialMessage.trim() || undefined
      });

      if (res && res.success && res.conversation) {
        setShowNewModal(false);
        setNewTitle('');
        setNewParticipantEmail('');
        setNewInitialMessage('');
        await loadConversations();
        setActiveConversation(res.conversation);
        if (onShowToast) {
          onShowToast({
            title: 'Conversation Created',
            message: `New message thread "${res.conversation.title}" opened.`,
            type: 'success'
          });
        }
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          title: 'Error',
          message: err.message || 'Failed to create conversation.',
          type: 'error'
        });
      }
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = (c.title || '').toLowerCase();
    const lastMsg = (c.last_message || c.lastMessage || '').toLowerCase();
    return title.includes(q) || lastMsg.includes(q);
  });

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* ── HEADER BANNER ── */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(16, 26, 48, 0.7) 0%, rgba(10, 16, 30, 0.9) 100%)',
        borderTop: '3px solid var(--cyber-purple)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="var(--cyber-purple)" />
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Institutional Communications & Messaging
              </h2>
              <span className="cyber-badge badge-purple" style={{ fontSize: '10px' }}>
                DATABASE DRIVEN
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Real-time multi-party correspondence with industry recruiters, corporate partners, and student candidates.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn-cyber-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
            >
              <Plus size={14} />
              <span>New Conversation</span>
            </button>
            <button
              onClick={loadConversations}
              disabled={loading}
              className="btn-cyber-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Refresh messages"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MESSAGING SPLIT INTERFACE ── */}
      <div className="glass-panel" style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        height: '620px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Left: Thread List */}
        <div style={{
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(10, 16, 30, 0.4)'
        }}>
          {/* Search Bar */}
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                <div className="spinner" style={{ margin: '0 auto 8px', width: '20px', height: '20px' }} />
                Loading messages...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageSquare size={28} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  No messages yet.
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Start a new conversation thread with candidates or recruiter partners.
                </div>
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = activeConversation?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConversation(c)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--cyber-purple)' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--cyber-purple)' : 'var(--text-primary)' }}>
                        {c.title || 'Conversation Thread'}
                      </span>
                      {c.created_at && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {c.last_message || c.lastMessage || 'No messages exchanged yet'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(8, 12, 22, 0.6)' }}>
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.4)'
              }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {activeConversation.title || 'Conversation Thread'}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Authenticated encrypted communication channel
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messagesLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <div className="spinner" style={{ margin: '0 auto 8px', width: '22px', height: '22px' }} />
                    Loading conversation messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      No messages in this thread yet.
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Type a message below to start the conversation.
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender_user_id === institution?.userId || m.sender_user_id === institution?.id || m.senderRole === 'institution';
                    return (
                      <div
                        key={m.id || idx}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          fontSize: '10.5px',
                          color: 'var(--text-muted)',
                          marginBottom: '3px',
                          display: 'flex',
                          gap: '6px'
                        }}>
                          <span>{m.sender_name || (isMe ? 'Institution' : 'Participant')}</span>
                          <span>•</span>
                          <span>{m.sent_at ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '13px',
                          lineHeight: 1.45,
                          background: isMe ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255, 255, 255, 0.06)',
                          color: '#FFFFFF',
                          border: isMe ? 'none' : '1px solid var(--border-subtle)',
                          boxShadow: isMe ? '0 2px 10px rgba(99, 102, 241, 0.25)' : 'none'
                        }}>
                          {m.message_text || m.content || m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '10px',
                  background: 'rgba(10, 16, 30, 0.8)'
                }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '9px 14px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="btn-cyber-primary"
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    opacity: (!messageText.trim() || sending) ? 0.6 : 1
                  }}
                >
                  <span>Send</span>
                  <Send size={13} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
              <MessageSquare size={38} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No conversation selected
              </div>
              <div style={{ fontSize: '12px' }}>
                Select an existing thread from the left or create a new conversation.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NEW CONVERSATION MODAL ── */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Start New Conversation
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateConversation}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Conversation Subject / Thread Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Campus Placement Drive Inquiry"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Participant Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g., recruiter@company.com or student@campus.edu"
                  value={newParticipantEmail}
                  onChange={(e) => setNewParticipantEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Initial Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Type your initial message to open this thread..."
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-cyber-outline"
                  style={{ padding: '7px 14px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber-primary"
                  style={{ padding: '7px 16px', fontSize: '12px' }}
                >
                  Create Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
