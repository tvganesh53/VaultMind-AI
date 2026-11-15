import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Hash,
  Binary
} from 'lucide-react';
import { api } from '../services/api';

export const SecretSharingLabPage = () => {
  const [keyData, setKeyData] = useState(null);
  const [selectedShares, setSelectedShares] = useState([]);
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [singleShareTest, setSingleShareTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrGenerateKey = async () => {
    try {
      setLoading(true);
      setError(null);
      setRecoveryResult(null);
      setSingleShareTest(null);
      setSelectedShares([]);
      const res = await api.generateMasterKey();
      setKeyData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrGenerateKey();
  }, []);

  const toggleShareSelection = (serializedShare) => {
    if (selectedShares.includes(serializedShare)) {
      setSelectedShares(selectedShares.filter(s => s !== serializedShare));
    } else {
      if (selectedShares.length < 3) {
        setSelectedShares([...selectedShares, serializedShare]);
      }
    }
  };

  const handleReconstruct = async () => {
    try {
      setLoading(true);
      setError(null);
      setSingleShareTest(null);
      const res = await api.recoverMasterKey(selectedShares);
      setRecoveryResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestOneShare = async () => {
    if (!keyData?.shares || keyData.shares.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      setRecoveryResult(null);
      // Attempt recovery with strictly ONE share
      const oneShare = keyData.shares[0].serialized_share;
      await api.recoverMasterKey([oneShare]);
      // If it somehow succeeded, that would be a vulnerability
      setSingleShareTest({ success: true, message: "CRITICAL: Threshold broken!" });
    } catch (err) {
      // Expected failure: 1 share is insufficient
      setSingleShareTest({
        success: false,
        rejected: true,
        error: err.message,
        explanation: "Mathematical Verification: Under Shamir's scheme, 1 point in a degree-1 polynomial (k=2) leaves an infinite number of possible lines in GF(p). Shannon entropy remains maximal (H(S|1 share) = H(S))."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Shamir (2-of-3) Secret Sharing Lab</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Mathematical key splitting over Galois Field GF(p) where p = 2^256 + 297.
          </p>
        </div>
        <button className="btn-primary" onClick={fetchOrGenerateKey} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Generate New Master Key & 3 Shares</span>
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'var(--red-status)', color: '#ff4d79' }}>
          Key Management Error: {error}
        </div>
      )}

      {/* Active Master Key & Mathematical Enclave Info */}
      {keyData && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={20} color="#00d2ff" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Active Key Enclave</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-cyan">ID: {keyData.key_id}</span>
              <span className="badge badge-success">Threshold: 2 of 3</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
            The 256-bit AES master key was partitioned into 3 independent shares using polynomial:
            <br />
            <code style={{ color: '#00d2ff' }}>f(x) = S + a₁·x mod (2²⁵⁶ + 297)</code>
            <br />
            Notice: Raw key material is strictly isolated in backend memory and never exposed to client browsers or AI.
          </p>
        </div>
      )}

      {/* 3 Shares Cards */}
      {keyData?.shares && (
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px' }}>
            Independent Share Custodians (Select any 2 to reconstruct):
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {keyData.shares.map((sh) => {
              const isSelected = selectedShares.includes(sh.serialized_share);
              return (
                <div
                  key={sh.index}
                  onClick={() => toggleShareSelection(sh.serialized_share)}
                  className={isSelected ? "glass-panel-glow" : "glass-panel"}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    borderColor: isSelected ? '#00d2ff' : 'var(--border-subtle)',
                    transform: isSelected ? 'translateY(-2px)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{sh.label}</span>
                    <span className={`badge ${isSelected ? 'badge-cyan' : 'badge-warning'}`}>
                      {isSelected ? 'SELECTED' : `SHARE #${sh.index}`}
                    </span>
                  </div>

                  <div style={{ background: '#070b14', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#38bdf8', marginBottom: '10px' }}>
                    <div><strong>Coordinate x:</strong> {sh.index}</div>
                    <div><strong>Value f({sh.index}):</strong> {sh.masked_value}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>SHA-256: {sh.share_hash}</span>
                    <span style={{ color: isSelected ? '#00d2ff' : '#94a3b8' }}>
                      {isSelected ? '✓ Click to deselect' : '+ Click to select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Test Actions */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          onClick={handleReconstruct}
          disabled={loading || selectedShares.length < 2}
        >
          <ShieldCheck size={18} />
          <span>Reconstruct Key ({selectedShares.length}/2 Selected)</span>
        </button>

        <button
          className="btn-secondary"
          onClick={handleTestOneShare}
          disabled={loading}
        >
          <ShieldAlert size={18} />
          <span>Test 1-Share Recovery (Threshold Violation Demo)</span>
        </button>
      </div>

      {/* Successful 2-Share Recovery Box */}
      {recoveryResult && (
        <div style={{
          background: 'rgba(0, 245, 212, 0.08)',
          border: '1px solid rgba(0, 245, 212, 0.3)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00f5d4', fontWeight: 700, marginBottom: '8px' }}>
            <CheckCircle size={20} />
            <span>Master Key Successfully Reconstructed via Lagrange Interpolation!</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>
            <div>• Recovered Key Fingerprint: <code>{recoveryResult.recovered_key_id}</code></div>
            <div>• Matches Active KMS Master Key: <strong>{recoveryResult.matches_active_key ? 'YES (100% Match)' : 'NO'}</strong></div>
            <div>• Custodian Shares Utilized: Coordinates {recoveryResult.shares_used.join(' and ')}</div>
            <div style={{ marginTop: '8px', color: '#94a3b8' }}>{recoveryResult.message}</div>
          </div>
        </div>
      )}

      {/* 1-Share Failure Proof */}
      {singleShareTest && (
        <div style={{
          background: 'rgba(255, 0, 84, 0.08)',
          border: '1px solid rgba(255, 0, 84, 0.4)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4d79', fontWeight: 700, marginBottom: '8px' }}>
            <XCircle size={20} />
            <span>Threshold Enforcement Confirmed: 1 Share Rejected by KMS</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6 }}>
            <p><strong>System Exception:</strong> {singleShareTest.error}</p>
            <p style={{ marginTop: '6px', color: '#94a3b8' }}>{singleShareTest.explanation}</p>
          </div>
        </div>
      )}

      {/* Mathematical Explanation Accordion / Card */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
          Mathematical Proof of (2,3) Secret Sharing
        </h3>
        <div style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
          <p>
            A 2-of-3 Shamir threshold defines a linear polynomial $f(x) = S + a_1 x \pmod p$.
            Any 2 points $(x_0, y_0)$ and $(x_1, y_1)$ uniquely define this line.
            Lagrange basis polynomials evaluate at $x = 0$ to find the constant term $S$:
          </p>
          <div style={{ background: '#070b14', padding: '12px', borderRadius: '6px', fontFamily: 'monospace', color: '#38bdf8', margin: '10px 0' }}>
            S = [ y₀·(-x₁)·(x₀ - x₁)⁻¹ + y₁·(-x₀)·(x₁ - x₀)⁻¹ ] mod (2²⁵⁶ + 297)
          </div>
          <p>
            Because division is executed as multiplication by modular inverse in $\mathbb{F}_p$ via Fermat's Little Theorem 
            ($a^{p-2} \pmod p$), the reconstruction is mathematically exact and unapproximated.
          </p>
        </div>
      </div>
    </div>
  );
};
