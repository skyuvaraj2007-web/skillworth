/**
 * Frontend Service: AI Career Copilot (Feature 6)
 */

const getApiBase = () => {
  return (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const careerCopilotService = {
  /**
   * Send a query to the AI Career Copilot
   */
  async sendMessage(message, conversationId = null) {
    const res = await fetch(`${getApiBase()}/ai/copilot/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, conversationId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to get response from AI Career Copilot');
    }
    return data.data;
  },

  /**
   * Retrieve active conversation history
   */
  async getHistory(conversationId = null) {
    const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : '';
    const res = await fetch(`${getApiBase()}/ai/copilot/history${query}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch conversation history');
    }
    return data.data || [];
  },

  /**
   * Clear conversation history
   */
  async clearHistory(conversationId = null) {
    const res = await fetch(`${getApiBase()}/ai/copilot/clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversationId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to clear chat history');
    }
    return data;
  }
};
