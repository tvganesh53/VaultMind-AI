import React, { useState } from 'react';
import { 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  RefreshCw, 
  Layers, 
  AlertCircle,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export const SecureChatPage = () => {
  const [prompt, setPrompt] = useState(
    "My card number is 4532 8912 3456 7890 and email is alice.smith@vaultcorp.com. Can you draft an expense report for my account 9876543210?"
  );
  const [customTerms, setCustomTerms] = useState("vaultcorp");
  const [storeEncrypted, setStoreEncrypted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const termsList = customTerms
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await api.sendChatMessage(prompt, termsList, storeEncrypted);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      title: "Corporate Financial Inquiry",
      text: "Transfer $12,500 from corporate account 112233445566 to employee john.doe@enterprise.io regarding payroll."
    },
    {
      title: "Personal Identity & Healthcare",
      text: "Citizen Aadhaar 4532 9812 7654 and phone +91 9876543210 submitted emergency claims. Please confirm eligibility."
    },
    {
      title: "E-Commerce Card Transaction",
      text: "Charge $450 to Visa card 4111 2222 3333 4444 and send invoice to client.billing@domain.org."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Secure AI Chat & Privacy Gateway</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Demonstration of zero-leakage prompt sanitization, local vault encryption, and isolated AI inference.
        </p>
      </div>

      {/* Preset Quick-Fill Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Load sample prompt:</span>
        {samplePrompts.map((s, idx) => (
          <button
            key={idx}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={() => setPrompt(s.text)}
          >
            <Sparkles size={13} color="#00d2ff" />
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Input Form Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', display: 'block' }}>
              Original User Prompt (May contain confidential financial or personal identifiers):
            </label>
            <textarea
              className="input-field"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter text with credit cards, emails, bank accounts, or Aadhaar numbers..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
                User-Defined Sensitive Keywords (comma separated):
              </label>
              <input
                type="text"
                className="input-field"
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="e.g. ProjectTitan, secretClient, vaultcorp"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
              <input
                type="checkbox"
                id="encryptVault"
                checked={storeEncrypted}
                onChange={(e) => setStoreEncrypted(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#00d2ff' }}
              />
              <label htmlFor="encryptVault" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                Seal sensitive payload into Local AES-256-GCM Vault
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
              {loading ? <RefreshCw size={18} className="spin" /> : <Send size={18} />}
              <span>{loading ? 'Processing Pipeline...' : 'Process Through Privacy Gateway'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'var(--red-status)', color: '#ff4d79' }}>
          <AlertCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Pipeline Error: {error}
        </div>
      )}

      {/* Pipeline Stage Visualization */}
      {result && (
        <div className="glass-panel-glow" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={20} color="#00d2ff" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Request Processing Stages</h3>
            </div>
            <span className={`badge ${result.provider_info.is_mock ? 'badge-warning' : 'badge-success'}`}>
              Provider: {result.provider_info.provider}
            </span>
          </div>

          {/* 6 Stage Indicators */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            marginBottom: '24px'
          }}>
            {[
              { name: '1. Input Received', ok: result.pipeline_stages.input_received },
              { name: '2. PII Detection', ok: result.pipeline_stages.sensitive_detected },
              { name: '3. Vault Encryption', ok: result.pipeline_stages.vault_encrypted },
              { name: '4. Prompt Sanitized', ok: result.pipeline_stages.prompt_sanitized },
              { name: '5. AI Processing', ok: result.pipeline_stages.ai_processed },
              { name: '6. Response Ready', ok: result.pipeline_stages.response_received },
            ].map((st, i) => (
              <div key={i} style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: st.ok ? 'rgba(0, 245, 212, 0.08)' : 'rgba(30, 41, 59, 0.5)',
                border: st.ok ? '1px solid rgba(0, 245, 212, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: st.ok ? '#00f5d4' : '#94a3b8'
              }}>
                <CheckCircle2 size={14} color={st.ok ? '#00f5d4' : '#64748b'} />
                <span>{st.name}</span>
              </div>
            ))}
          </div>

          {/* Side-by-Side: Detected Entities vs Sanitized Prompt Dispatched to AI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* Detected Sensitive Information */}
            <div style={{ background: 'rgba(10, 16, 26, 0.7)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(45, 74, 110, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  Detected Sensitive Tokens ({result.detections.length})
                </span>
                <span className="badge badge-danger">REDACTED</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.detections.length === 0 ? (
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No sensitive patterns detected.</span>
                ) : (
                  result.detections.map((d, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 0, 84, 0.08)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ color: '#00d2ff', fontWeight: 600 }}>{d.placeholder}</span>
                      <span style={{ color: '#ff4d79' }}>{d.type}</span>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{d.masked_preview}</span>
                    </div>
                  ))
                )}
              </div>
              {result.vault_record_id && (
                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#00f5d4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={12} />
                  <span>Sealed in AES-256 Vault: Record ID <code>{result.vault_record_id}</code></span>
                </div>
              )}
            </div>

            {/* Sanitized Prompt Received by AI */}
            <div style={{ background: 'rgba(10, 16, 26, 0.7)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(45, 74, 110, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  What the External AI Received
                </span>
                <span className="badge badge-success">ISOLATED TRUST BOUNDARY</span>
              </div>
              <div style={{
                background: '#040711',
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#38bdf8',
                lineHeight: 1.5,
                minHeight: '80px'
              }}>
                {result.sanitized_prompt}
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#64748b' }}>
                Notice: Plaintext identifiers, AES keys, and Shamir shares were completely withheld from this inference payload.
              </div>
            </div>

          </div>

          {/* AI Response Display */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#00d2ff" />
                <span style={{ fontWeight: 600, color: '#fff' }}>AI Response</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Latency: {result.provider_info.latency_ms}ms • Model: {result.provider_info.model}
              </span>
            </div>
            <div style={{
              whiteSpace: 'pre-wrap',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
              background: '#090d16',
              padding: '16px',
              borderRadius: '6px'
            }}>
              {result.ai_response}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
