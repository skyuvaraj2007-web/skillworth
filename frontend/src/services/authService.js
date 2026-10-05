/**
 * SKILLNEXUS AI — Production Authentication Service
 * Communicates with backend REST auth endpoints backed by PostgreSQL / normalized relational DB.
 * Supports HTTP-only session cookies with credentials: 'include' and bearer token backup.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');
const API_AUTH_BASE = `${API_BASE}/api/auth`;

export const authService = {
  getToken() {
    return localStorage.getItem('nexus_token') || null;
  },

  getStoredUser() {
    try {
      const u = localStorage.getItem('nexus_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  /**
   * Log in user against backend credentials
   * @param {string} email 
   * @param {string} password 
   * @param {string} [role] 
   */
  async login(email, password, role = null) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Authentication failed. Please check your credentials.'
        };
      }

      if (data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));

        // Persist login calendar tracking date
        try {
          const uKey = data.user.id || data.user.studentId || data.user.email || 'student';
          const loginStorageKey = `nexus_student_logins_${uKey}`;
          const todayIso = new Date().toISOString().split('T')[0];
          const storedLogins = JSON.parse(localStorage.getItem(loginStorageKey) || '[]');
          if (!storedLogins.includes(todayIso)) {
            storedLogins.push(todayIso);
            localStorage.setItem(loginStorageKey, JSON.stringify(storedLogins));
          }
        } catch (e) {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_auth_changed', { detail: data.user }));
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (err) {
      console.error('[authService] Network login error:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Ensure backend is running.'
      };
    }
  },

  /**
   * Dedicated Academician / Faculty Login
   * @param {string} email
   * @param {string} password
   * @param {boolean} [rememberMe=false]
   */
  async academicianLogin(email, password, rememberMe = false) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/academician/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Authentication failed. Please check your credentials.'
        };
      }

      if (data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_auth_changed', { detail: data.user }));
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (err) {
      console.error('[authService] Academician login error:', err);
      return {
        success: false,
        message: 'Unable to login right now. Please try again.'
      };
    }
  },

  /**
   * Register a new user account
   * @param {Object} userData 
   */
  async register(userData) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Registration failed. Please check your information.'
        };
      }

      if (data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (err) {
      console.error('[authService] Network register error:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Ensure backend is running.'
      };
    }
  },

  /**
   * Verify session and retrieve current authenticated user
   */
  async getCurrentUser() {
    const token = this.getToken();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_AUTH_BASE}/me`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!res.ok) {
        const savedUser = (() => {
          try {
            const raw = localStorage.getItem('nexus_auth_user') || localStorage.getItem('nexus_user');
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })();

        if (savedUser) {
          localStorage.setItem('nexus_user', JSON.stringify(savedUser));
          localStorage.setItem('nexus_auth_user', JSON.stringify(savedUser));
          return { success: true, user: savedUser };
        }

        // Session expired or invalid
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('token');
        localStorage.removeItem('nexus_user');
        localStorage.removeItem('nexus_auth_user');
        return { success: false, user: null };
      }

      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      return { success: false, user: null };
    } catch (err) {
      console.warn('[authService] getCurrentUser error:', err);
      return { success: false, user: null };
    }
  },

  /**
   * End current session and clear tokens
   */
  async logout() {
    try {
      await fetch(`${API_AUTH_BASE}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.warn('[authService] logout network error:', err);
    } finally {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('token');
      localStorage.removeItem('nexus_user');
      localStorage.removeItem('nexus_auth_user');
      localStorage.removeItem('nexus_student_profile');
      localStorage.removeItem('nexus_institution_profile');
      localStorage.removeItem('nexus_industry_profile');
      try {
        sessionStorage.removeItem('nexus_otp_params');
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_auth_changed', { detail: null }));
      }
    }
    return { success: true };
  },


  /**
   * Fetch list of registered institutions with academic structures (supports state filtering)
   */
  async getRegisteredInstitutions(state = '') {
    try {
      const url = state ? `${API_AUTH_BASE}/institutions/registered?state=${encodeURIComponent(state)}` : `${API_AUTH_BASE}/institutions/registered`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? (data.institutions || data.data || []) : [];
    } catch (err) {
      console.warn('[authService] getRegisteredInstitutions error:', err);
      return [];
    }
  },

  /**
   * Fetch live institutions from Supabase with optional state filter
   */
  async getInstitutions(state = '') {
    try {
      const url = state ? `${API_AUTH_BASE}/institutions?state=${encodeURIComponent(state)}` : `${API_AUTH_BASE}/institutions`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? (data.institutions || data.data || []) : [];
    } catch (err) {
      console.warn('[authService] getInstitutions error:', err);
      return [];
    }
  },

  /**
   * Fetch 38 Tamil Nadu districts for college master search
   */
  async getTamilNaduDistricts() {
    try {
      const res = await fetch(`${API_BASE}/api/college-master/districts`);
      const data = await res.json();
      return data.success ? data.districts : [];
    } catch (err) {
      console.warn('[authService] getTamilNaduDistricts error:', err);
      return [];
    }
  },

  /**
   * Search Tamil Nadu engineering college master database
   */
  async searchMasterColleges(query = '', district = '') {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (district) params.append('district', district);
      const res = await fetch(`${API_BASE}/api/college-master/search?${params.toString()}`);
      const data = await res.json();
      return data.success ? data.colleges : [];
    } catch (err) {
      console.warn('[authService] searchMasterColleges error:', err);
      return [];
    }
  },

  /**
   * Verify Demo OTP for Registration or Password Reset
   */
  async verifyOtp(email, otp, purpose = 'REGISTRATION') {
    try {
      const res = await fetch(`${API_AUTH_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp, purpose })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
      }
      if (data.success && data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Could not connect to authentication server.' };
    }
  },

  /**
   * Resend Demo OTP
   */
  async resendOtp(email, purpose = 'REGISTRATION') {
    try {
      const res = await fetch(`${API_AUTH_BASE}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not connect to authentication server.' };
    }
  },

  /**
   * Request password reset token / demo OTP
   */
  async forgotPassword(email, role = null) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  /**
   * Verify password reset OTP
   */
  async verifyResetOtp(email, otp) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not connect to authentication server.' };
    }
  },

  /**
   * Submit new password with OTP or reset token
   */
  async resetPassword(tokenOrPayload, otpOrPassword, maybeNewPassword) {
    try {
      let body;
      if (typeof tokenOrPayload === 'object' && tokenOrPayload !== null) {
        body = JSON.stringify(tokenOrPayload);
      } else if (maybeNewPassword !== undefined) {
        // Called as resetPassword(email, otp, newPassword)
        body = JSON.stringify({ email: tokenOrPayload, otp: otpOrPassword, newPassword: maybeNewPassword });
      } else {
        // Called as resetPassword(token, newPassword)
        body = JSON.stringify({ token: tokenOrPayload, newPassword: otpOrPassword });
      }
      const res = await fetch(`${API_AUTH_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not reach server.' };
    }
  },

  async resetPasswordWithOtp(email, otp, newPassword) {
    return this.resetPassword({ email, otp, newPassword });
  },

  /**
   * Check if Google Identity Services is configured on the backend
   */
  async getGoogleConfig() {
    try {
      const res = await fetch(`${API_AUTH_BASE}/google/config`);
      return await res.json();
    } catch (err) {
      return { success: false, configured: false, clientId: null };
    }
  },

  /**
   * Authenticate or initiate flow with verified Google credential
   */
  async googleLogin(credential) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential })
      });
      const data = await res.json();

      if (data.action === 'LOGIN_SUCCESS' && data.token && data.user) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
      }

      return data;
    } catch (err) {
      console.error('[authService] googleLogin error:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please try again.'
      };
    }
  },

  /**
   * Link Google identity to existing email account
   */
  async linkGoogleAccount(payload) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/google/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
      }

      return data;
    } catch (err) {
      console.error('[authService] linkGoogleAccount error:', err);
      return {
        success: false,
        message: 'Could not link Google account. Server error.'
      };
    }
  },

  /**
   * Complete Google new user onboarding with selected sector and profile
   */
  async completeGoogleOnboarding(payload) {
    try {
      const res = await fetch(`${API_AUTH_BASE}/google/complete-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem('nexus_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        localStorage.setItem('nexus_auth_user', JSON.stringify(data.user));
      }

      return data;
    } catch (err) {
      console.error('[authService] completeGoogleOnboarding error:', err);
      return {
        success: false,
        message: 'Could not complete onboarding. Server error.'
      };
    }
  },

  /**
   * Fetch registered institutions with academic structures for student onboarding
   */
  async getRegisteredInstitutions(state = '') {
    try {
      const url = state ? `${API_AUTH_BASE}/institutions/registered?state=${encodeURIComponent(state)}` : `${API_AUTH_BASE}/institutions/registered`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.institutions)) {
        return data.institutions;
      }
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err) {
      console.warn('[authService] getRegisteredInstitutions error:', err);
      return [];
    }
  }
};
