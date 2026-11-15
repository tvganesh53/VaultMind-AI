import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  EyeOff, 
  Cpu, 
  AlertOctagon, 
  RefreshCw,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { api } from '../services/api';

export const DashboardPage = ({ setActivePage }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <RefreshCw size={32} className="spin" color="#00d2ff" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    total_vault_records: 0,
    encryption_operations: 0,
    redaction_operations: 0,
    ai_requests: 0,
    security_alerts: 0
  };

  const chartData = [
    { name: 'Encryptions', count: metrics.encryption_operations },
    { name: 'Redactions', count: metrics.redaction_operations },
    { name: 'AI Dispatches', count: metrics.ai_requests },
    { name: 'Vault Stored', count: metrics.total_vault_records },
  ];

  const engines = data?.engines || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Security Operations Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Real-time telemetry from active cryptographic enclaves and privacy gateways
          </p>
        </div>
        <button className="btn-secondary" onClick={loadDashboard}>
          <RefreshCw size={16} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'var(--red-status)', color: '#ff4d79' }}>
          Telemetry Error: {error}
        </div>
      )}

      {/* Subsystem Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Encryption Engine */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>ENCRYPTION ENGINE</span>
            <span className="badge badge-success">ONLINE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Lock size={20} color="#00d2ff" />
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>AES-256-GCM</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            96-bit CSPRNG Nonce / 128-bit GMAC Tag
          </p>
        </div>

        {/* Key Management Service */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>KEY ENCLAVE (KMS)</span>
            <span className="badge badge-success">ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Key size={20} color="#3a86ff" />
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Shamir (2, 3)</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Active Key: {engines.key_management?.key_id || 'vmk_active'}
          </p>
        </div>

        {/* Privacy Gateway */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>PRIVACY GATEWAY</span>
            <span className="badge badge-cyan">ENFORCING</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <EyeOff size={20} color="#00f5d4" />
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>6 PII Filters</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Cards, Accounts, Emails, IDs, Custom
          </p>
        </div>

        {/* AI Provider Status */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>AI INFERENCE</span>
            <span className={`badge ${engines.ai_provider?.is_mock ? 'badge-warning' : 'badge-success'}`}>
              {engines.ai_provider?.is_mock ? 'MOCK MODE' : 'LIVE API'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Cpu size={20} color={engines.ai_provider?.is_mock ? '#ffbe0b' : '#00f5d4'} />
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {engines.ai_provider?.provider || 'VaultMind Mock AI'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Boundary: Zero Key Exposure
          </p>
        </div>

      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Encryption Operations', val: metrics.encryption_operations, color: '#00d2ff' },
          { label: 'Redacted Sensitive Items', val: metrics.redaction_operations, color: '#00f5d4' },
          { label: 'AI Dispatched Requests', val: metrics.ai_requests, color: '#3a86ff' },
          { label: 'Vault Stored Records', val: metrics.total_vault_records, color: '#8338ec' },
          { label: 'Integrity Alerts', val: metrics.security_alerts, color: '#ff4d79' },
        ].map((m, i) => (
          <div key={i} className="glass-panel" style={{ padding: '18px' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{m.label}</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color, marginTop: '6px' }}>
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Live Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Operations Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
            Cryptographic & Privacy Volume
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="count" fill="#00d2ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Audit Events */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Backend Audit Events</h3>
            <button 
              onClick={() => setActivePage('monitor')}
              style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '220px' }}>
            {(data?.recent_events || []).length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                No audit events recorded yet. Try running an encryption or chat prompt!
              </div>
            ) : (
              (data?.recent_events || []).slice(0, 5).map((evt) => (
                <div key={evt.id} style={{
                  padding: '10px 12px',
                  background: 'rgba(10, 16, 26, 0.6)',
                  borderRadius: '6px',
                  borderLeft: evt.status === 'SUCCESS' ? '3px solid #00f5d4' : '3px solid #ff4d79',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{evt.action}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{evt.created_at}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{evt.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
