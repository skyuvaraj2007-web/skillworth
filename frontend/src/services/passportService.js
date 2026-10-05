/**
 * Frontend Service: Digital Skill Passport (Feature 4)
 */

const getApiBase = () => {
  return (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '') + '/api';
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const passportService = {
  /**
   * Retrieve authenticated student's full passport
   */
  async getMyPassport() {
    const res = await fetch(`${getApiBase()}/passport`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch digital passport');
    }
    return data.data;
  },

  /**
   * Update public status & privacy toggles
   */
  async updatePrivacySettings({ isPublic, privacySettings }) {
    const res = await fetch(`${getApiBase()}/passport/privacy`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isPublic, privacySettings })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to update privacy settings');
    }
    return data.data;
  },

  /**
   * Retrieve public verified passport for external recruiters (NO AUTH REQUIRED)
   */
  async getPublicPassport(publicId) {
    const res = await fetch(`${getApiBase()}/passport/public/${encodeURIComponent(publicId)}`);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || 'Passport lookup failed');
      err.isPrivate = data.isPrivate;
      err.status = res.status;
      throw err;
    }
    return data.data;
  },

  /**
   * Export JSON-LD credential document
   */
  getExportJsonLdUrl() {
    return `${getApiBase()}/passport/export-jsonld`;
  }
};

export default passportService;
