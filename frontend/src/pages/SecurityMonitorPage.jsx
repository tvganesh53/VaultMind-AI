import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  Key, 
  Cpu,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export const SecurityMonitorPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getSecurityEvents(100);
      setEvents(res.events || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type) => {
    switch (type) {
      case 'ENCRYPTION':
      case 'DECRYPTION':
        return <Lock size={16} color="#00d2ff" />;
      case 'KMS':
        return <Key size={16} color="#3a86ff" />;
      case 'REDACTION':
        return <EyeOff size={16} color="#00f5d4" />;
      case 'AI_QUERY':
        return <Cpu size={16} color="#8338ec" />;
      case 'TAMPER_TEST':
        return <ShieldAlert size={16} color="#ff4d79" />;
      default:
        return <FileText size={16} color="#94a3b8" />;
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesType = filterType === 'ALL' || e.event_type === filterType;
    const matchesSearch = 
      e.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.event_type?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Security Audit Monitor</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Immutable backend event telemetry. Confidential PII and cryptographic keys are strictly excluded.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchEvents} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '16px', borderColor: 'var(--red-status)', color: '#ff4d79' }}>
          Audit Log Retrieval Failed: {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="input-field"
            placeholder="Search audit actions, details, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'ENCRYPTION', 'DECRYPTION', 'REDACTION', 'KMS', 'AI_QUERY', 'TAMPER_TEST'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={filterType === t ? "badge badge-cyan" : "badge"}
              style={{
                cursor: 'pointer',
                background: filterType === t ? 'rgba(0, 210, 255, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                border: filterType === t ? '1px solid #00d2ff' : '1px solid rgba(45, 74, 110, 0.4)',
                color: filterType === t ? '#00d2ff' : '#94a3b8'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Feed */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(10, 16, 26, 0.8)', borderBottom: '1px solid rgba(45, 74, 110, 0.4)' }}>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>Subsystem</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>Security Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Fetching audit logs...' : 'No security events match the current filter.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr 
                    key={evt.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(45, 74, 110, 0.2)',
                      background: evt.status === 'FAILURE' || evt.status === 'TAMPER_DETECTED' 
                        ? 'rgba(255, 0, 84, 0.03)' 
                        : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {evt.created_at}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getEventIcon(evt.event_type)}
                        <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{evt.event_type}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#38bdf8' }}>
                      {evt.action}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span className={`badge ${
                        evt.status === 'SUCCESS' ? 'badge-success' : 
                        evt.status === 'TAMPER_DETECTED' ? 'badge-danger' : 
                        evt.status === 'FAILURE' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>
                      {evt.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
