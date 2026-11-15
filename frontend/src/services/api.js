// VaultMind AI API Service Layer
// Communicates with FastAPI backend with zero key exposure to client storage

const API_BASE = '/api';

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch('/health');
    return res.json();
  },

  // Dashboard Overview
  async getDashboardSummary() {
    const res = await fetch(`${API_BASE}/dashboard`);
    if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.statusText}`);
    return res.json();
  },

  // Encryption Engine
  async encrypt(plaintext, recordId = null) {
    const res = await fetch(`${API_BASE}/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plaintext, record_id: recordId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Encryption failed');
    }
    return res.json();
  },

  async decrypt(ciphertext, nonce, tag, recordId = null) {
    const res = await fetch(`${API_BASE}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciphertext, nonce, tag, record_id: recordId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Decryption failed');
    }
    return res.json();
  },

  async tamperTest(ciphertext, nonce, tag) {
    const res = await fetch(`${API_BASE}/security/tamper-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciphertext, nonce, tag })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Tamper test failed');
    }
    return res.json();
  },

  // Privacy Redaction & AI Chat
  async redact(text, customTerms = []) {
    const res = await fetch(`${API_BASE}/redact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, custom_terms: customTerms })
    });
    if (!res.ok) throw new Error('Redaction failed');
    return res.json();
  },

  async sendChatMessage(prompt, customTerms = [], storeEncrypted = true) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        custom_terms: customTerms,
        store_encrypted: storeEncrypted
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'AI pipeline request failed');
    }
    return res.json();
  },

  async getAIStatus() {
    const res = await fetch(`${API_BASE}/ai/status`);
    return res.json();
  },

  // KMS & Shamir Secret Sharing
  async getKMSStatus() {
    const res = await fetch(`${API_BASE}/keys/status`);
    return res.json();
  },

  async generateMasterKey() {
    const res = await fetch(`${API_BASE}/keys/generate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate master key');
    return res.json();
  },

  async recoverMasterKey(shares) {
    const res = await fetch(`${API_BASE}/keys/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shares })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Key recovery failed');
    }
    return res.json();
  },

  // Security Audit Events
  async getSecurityEvents(limit = 50) {
    const res = await fetch(`${API_BASE}/security/events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch security events');
    return res.json();
  }
};
