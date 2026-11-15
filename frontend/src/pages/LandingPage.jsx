import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Key, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Server, 
  FileCode,
  EyeOff
} from 'lucide-react';

export const LandingPage = ({ onStartSession }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Section */}
      <div className="glass-panel-glow" style={{ padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '820px', zIndex: 2, position: 'relative' }}>
          <div className="badge badge-cyan" style={{ marginBottom: '16px' }}>
            Mathematics for Systems Security — AI Pipeline Secret Sharing
          </div>
          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '18px'
          }}>
            Your Data. <span style={{ color: '#00d2ff' }}>Your Keys.</span> Your Privacy.
          </h1>
          <p style={{
            fontSize: '1.15rem',
            lineHeight: 1.6,
            color: '#94a3b8',
            marginBottom: '28px'
          }}>
            VaultMind AI is an enterprise privacy-preserving AI architecture. By combining 
            <strong> AES-256-GCM authenticated encryption</strong>, <strong>Shamir's 2-of-3 Secret Sharing</strong> over Galois Field $GF(2^{256}+297)$, 
            and an automated PII Redaction Gateway, your confidential information never reaches remote LLM servers.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={onStartSession}>
              <span>Start Secure Session</span>
              <ArrowRight size={18} />
            </button>
            <button className="btn-secondary" onClick={() => window.open('/docs/mathematical_explanation.md', '_blank')}>
              <FileCode size={18} />
              <span>Cryptographic Specs</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          right: '-5%',
          top: '-20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0, 210, 255, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Core Architectural Pillars */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px' }}>
          Architectural Security Pillars
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(0, 210, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00d2ff',
              marginBottom: '16px'
            }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>
              AES-256-GCM Encryption
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Persisted confidential user data is authenticated using AES-256 in Galois/Counter Mode with 
              96-bit CSPRNG nonces. Decryption enforces GMAC tag verification against tampering.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(58, 134, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3a86ff',
              marginBottom: '16px'
            }}>
              <Key size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>
              Shamir Secret Sharing (2-of-3)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
              The 256-bit master key is split into 3 mathematical shares on polynomial $f(x)=S+a_1x \pmod p$.
              Any 2 shares reconstruct the key; 1 share alone contains zero Shannon information.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(0, 245, 212, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00f5d4',
              marginBottom: '16px'
            }}>
              <EyeOff size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>
              PII Redaction Gateway
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Pre-flight regex and token sanitization identifies emails, cards, bank accounts, and Aadhaar identifiers.
              Sensitive data is replaced with surrogate placeholders before AI dispatch.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(131, 56, 236, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8338ec',
              marginBottom: '16px'
            }}>
              <Cpu size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>
              Isolated AI Trust Boundary
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
              The external LLM (OpenAI or local Mock AI) operates across an isolated trust boundary. 
              It never accesses the master encryption key, cryptographic shares, or raw database records.
            </p>
          </div>

        </div>
      </div>

      {/* Security Pipeline Flow */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px' }}>
          Zero-Leakage Privacy Pipeline
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {[
              { step: '1. User Input', desc: 'Raw prompt entered in authorized UI' },
              { step: '2. PII Detection', desc: 'Gateway scans for cards, emails, accounts' },
              { step: '3. Local Vault Encrypt', desc: 'Original data sealed in AES-256-GCM vault' },
              { step: '4. Prompt Sanitization', desc: 'Replaced with [TOKEN_#] placeholders' },
              { step: '5. AI Processing', desc: 'Sanitized prompt dispatched to LLM' },
              { step: '6. Protected Output', desc: 'Response rendered with audit trail' }
            ].map((st, i) => (
              <div key={i} style={{
                background: 'rgba(10, 16, 26, 0.7)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(45, 74, 110, 0.3)'
              }}>
                <div style={{ color: '#00d2ff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                  {st.step}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  {st.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
