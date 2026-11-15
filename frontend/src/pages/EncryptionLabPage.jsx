import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  Copy,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { api } from '../services/api';

export const EncryptionLabPage = () => {
  const [plaintext, setPlaintext] = useState("Confidential Vault Record: Account #987654321 with balance $4,500,000");
  const [ciphertext, setCiphertext] = useState('');
  const [nonce, setNonce] = useState('');
  const [tag, setTag] = useState('');
  const [keyId, setKeyId] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleEncrypt = async () => {
    try {
      setLoading(true);
      setError(null);
      setTamperResult(null);
      setDecryptedText('');
      const res = await api.encrypt(plaintext);
      setCiphertext(res.ciphertext);
      setNonce(res.nonce);
      setTag(res.tag);
      setKeyId(res.key_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.decrypt(ciphertext, nonce, tag);
      setDecryptedText(res.plaintext);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTamperTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.tamperTest(ciphertext, nonce, tag);
      setTamperResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>AES-256-GCM Encryption Lab</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Interactive testing of authenticated encryption, CSPRNG nonces, and GMAC tamper-proofing.
        </p>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'var(--red-status)', color: '#ff4d79' }}>
          <AlertTriangle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Cryptographic Operation Failed: {error}
        </div>
      )}

      {/* Input Plaintext */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
          1. Plaintext Payload
        </h3>
        <textarea
          className="input-field"
          rows={3}
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          placeholder="Enter sensitive data to encrypt..."
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Master Key: Isolated in KMS memory enclave (AES-256-GCM)
          </span>
          <button className="btn-primary" onClick={handleEncrypt} disabled={loading || !plaintext.trim()}>
            {loading ? <RefreshCw size={16} className="spin" /> : <Lock size={16} />}
            <span>Encrypt with AES-256-GCM</span>
          </button>
        </div>
      </div>

      {/* Ciphertext & Cryptographic Artifacts */}
      {ciphertext && (
        <div className="glass-panel-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>2. Cryptographic Output Artifacts</h3>
            <span className="badge badge-cyan">Key ID: {keyId}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Ciphertext */}
            <div style={{ background: '#070b14', padding: '14px', borderRadius: '8px', border: '1px solid rgba(45, 74, 110, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>CIPHERTEXT (Base64)</span>
                <button 
                  onClick={() => copyToClipboard(ciphertext)}
                  style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: '#38bdf8' }}>
                {ciphertext}
              </p>
            </div>

            {/* Nonce */}
            <div style={{ background: '#070b14', padding: '14px', borderRadius: '8px', border: '1px solid rgba(45, 74, 110, 0.4)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                NONCE / IV (96-bit CSPRNG)
              </span>
              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: '#00f5d4' }}>
                {nonce}
              </p>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Fresh 12-byte random entropy</span>
            </div>

            {/* Auth Tag */}
            <div style={{ background: '#070b14', padding: '14px', borderRadius: '8px', border: '1px solid rgba(45, 74, 110, 0.4)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                GMAC AUTH TAG (128-bit)
              </span>
              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: '#f43f5e' }}>
                {tag}
              </p>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>16-byte Galois Field authentication</span>
            </div>
          </div>

          {/* Action Buttons: Decrypt & Tamper Test */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '8px' }}>
            <button className="btn-secondary" onClick={handleDecrypt} disabled={loading}>
              <Unlock size={16} />
              <span>Verify & Decrypt Valid Payload</span>
            </button>
            <button className="btn-danger" onClick={handleTamperTest} disabled={loading}>
              <Flame size={16} />
              <span>Test Tampering & GMAC Verification Failure</span>
            </button>
          </div>

          {/* Decryption Success Box */}
          {decryptedText && (
            <div style={{
              background: 'rgba(0, 245, 212, 0.08)',
              border: '1px solid rgba(0, 245, 212, 0.3)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f5d4', fontWeight: 600, marginBottom: '6px' }}>
                <ShieldCheck size={18} />
                <span>Authentication & Decryption Succeeded!</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#f8fafc', fontFamily: 'monospace' }}>
                {decryptedText}
              </p>
            </div>
          )}

          {/* Tamper Result Box */}
          {tamperResult && (
            <div style={{
              background: 'rgba(255, 0, 84, 0.08)',
              border: '1px solid rgba(255, 0, 84, 0.4)',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d79', fontWeight: 700 }}>
                <ShieldAlert size={20} />
                <span>TAMPER DETECTED: GMAC Authentication Tag Failed!</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                <div><strong>Tampered Ciphertext (Bit 0 Inverted):</strong></div>
                <div style={{ fontFamily: 'monospace', color: '#f43f5e', wordBreak: 'break-all', margin: '4px 0 8px 0' }}>
                  {tamperResult.tampered_ciphertext}
                </div>
                <div><strong>Cryptographic Engine Error:</strong> {tamperResult.cryptographic_error}</div>
                <div style={{ marginTop: '6px', color: '#94a3b8' }}>{tamperResult.explanation}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
