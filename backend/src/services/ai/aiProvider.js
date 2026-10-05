/**
 * SKILLNEXUS AI — AI Provider Abstraction
 * Supports configurable LLM backends (Gemini, OpenAI, Mock/Offline)
 * Server-side only. Never exposes keys to frontend.
 */

const https = require('https');

class AIProvider {
  constructor() {
    this.provider = (process.env.AI_PROVIDER || 'offline').toLowerCase();
    this.apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    this.model = process.env.AI_MODEL || (this.provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    this.timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 10000;
  }

  isAvailable() {
    return Boolean(this.apiKey && this.provider !== 'offline' && this.provider !== 'none');
  }

  /**
   * Universal completion interface
   * Returns: { success: boolean, text?: string, error?: string, code?: string }
   */
  async generateCompletion({ prompt, systemPrompt = 'You are NEXUS AI, an authoritative career and skill intelligence assistant for SkillNexus.', temperature = 0.2 }) {
    if (!this.isAvailable()) {
      return {
        success: false,
        code: 'AI_UNAVAILABLE',
        message: 'AI service provider is not configured or offline. Running in deterministic rule mode.'
      };
    }

    try {
      if (this.provider === 'openai') {
        return await this._callOpenAI({ prompt, systemPrompt, temperature });
      } else if (this.provider === 'gemini') {
        return await this._callGemini({ prompt, systemPrompt, temperature });
      } else {
        return {
          success: false,
          code: 'UNSUPPORTED_PROVIDER',
          message: `AI provider "${this.provider}" is not recognized.`
        };
      }
    } catch (err) {
      console.warn('[AIProvider] Model completion failed:', err.message);
      return {
        success: false,
        code: 'AI_CALL_FAILED',
        message: err.message
      };
    }
  }

  // --- OpenAI / Compatible REST implementation ---
  _callOpenAI({ prompt, systemPrompt, temperature }) {
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature
      });

      const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: this.timeoutMs
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const text = data.choices?.[0]?.message?.content?.trim() || '';
              resolve({ success: true, text });
            } else {
              resolve({ success: false, code: 'API_ERROR', message: data.error?.message || `HTTP ${res.statusCode}` });
            }
          } catch (e) {
            resolve({ success: false, code: 'PARSE_ERROR', message: e.message });
          }
        });
      });

      req.on('error', (e) => resolve({ success: false, code: 'NETWORK_ERROR', message: e.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, code: 'TIMEOUT', message: 'AI request timed out' });
      });

      req.write(payload);
      req.end();
    });
  }

  // --- Google Gemini REST implementation ---
  _callGemini({ prompt, systemPrompt, temperature }) {
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
        ],
        generationConfig: { temperature }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: this.timeoutMs
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
              resolve({ success: true, text });
            } else {
              resolve({ success: false, code: 'API_ERROR', message: data.error?.message || `HTTP ${res.statusCode}` });
            }
          } catch (e) {
            resolve({ success: false, code: 'PARSE_ERROR', message: e.message });
          }
        });
      });

      req.on('error', (e) => resolve({ success: false, code: 'NETWORK_ERROR', message: e.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, code: 'TIMEOUT', message: 'AI request timed out' });
      });

      req.write(payload);
      req.end();
    });
  }
}

module.exports = new AIProvider();
