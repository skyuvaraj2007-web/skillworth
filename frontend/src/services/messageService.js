/**
 * SKILL NEXUS AI — Real Database-Driven Message & Conversation Service
 * Connects directly to backend /api/messages backed by PostgreSQL.
 * Strict relationship and participant authentication.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const messageService = {
  /**
   * Get all active conversations for the authenticated user.
   */
  async getConversations() {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Failed to load conversations (${res.status})`);
      }
      const json = await res.json();
      const conversations = Array.isArray(json?.data) ? json.data : Array.isArray(json?.conversations) ? json.conversations : Array.isArray(json) ? json : [];
      return { success: true, data: conversations, conversations, count: conversations.length };
    } catch (err) {
      console.warn('[messageService.getConversations] note:', err.message);
      return { success: false, data: [], conversations: [], count: 0 };
    }
  },

  /**
   * Get messages for a specific conversation.
   */
  async getMessages(conversationId) {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations/${encodeURIComponent(conversationId)}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`Failed to load messages (${res.status})`);
      }
      const json = await res.json();
      const messages = Array.isArray(json?.data) ? json.data : Array.isArray(json?.messages) ? json.messages : Array.isArray(json) ? json : [];
      return { success: true, data: messages, messages, count: messages.length };
    } catch (err) {
      console.warn('[messageService.getMessages] note:', err.message);
      return { success: false, data: [], messages: [], count: 0 };
    }
  },

  /**
   * Send a message to an existing conversation.
   */
  async sendMessage(conversationId, text) {
    const res = await fetch(`${API_BASE}/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to send message (${res.status})`);
    }
    const json = await res.json();
    return {
      ...json,
      success: json.success !== false,
      data: json.data ?? json.message ?? null,
      message: json.message ?? json.data ?? null
    };
  },

  /**
   * Start a new conversation with a recipient user.
   */
  async createConversation(payloadOrRecipientUserId, initialMessage = null, title = null, opportunityId = null) {
    const payload = typeof payloadOrRecipientUserId === 'object' && payloadOrRecipientUserId !== null
      ? payloadOrRecipientUserId
      : {
          recipientUserId: payloadOrRecipientUserId,
          title,
          opportunityId,
          initialMessage
        };

    const res = await fetch(`${API_BASE}/messages/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to create conversation (${res.status})`);
    }
    const json = await res.json();
    return {
      ...json,
      success: json.success !== false,
      conversation: json.conversation ?? json.data ?? null,
      data: json.data ?? json.conversation ?? null
    };
  }
};
