import React from 'react';
import { 
  Shield, 
  Terminal, 
  Key, 
  Lock, 
  Activity, 
  FileText,
  Home,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const Navbar = ({ activePage, setActivePage, sysHealth }) => {
  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Security Dashboard', icon: Activity },
    { id: 'chat', label: 'Secure AI Chat', icon: Terminal },
    { id: 'encryption', label: 'Encryption Lab', icon: Lock },
    { id: 'secret-sharing', label: 'Secret Sharing Lab', icon: Key },
    { id: 'monitor', label: 'Security Monitor', icon: FileText },
  ];

  return (
    <aside style={{
      width: '280px',
      background: 'rgba(11, 17, 28, 0.95)',
      borderRight: '1px solid rgba(45, 74, 110, 0.4)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      gap: '24px',
      flexShrink: 0
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #00d2ff, #3a86ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0a0e17'
        }}>
          <Shield size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            VaultMind <span style={{ color: '#00d2ff' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Privacy Gateway
          </p>
        </div>
      </div>

      {/* Navigation links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(0, 210, 255, 0.12)' : 'transparent',
                color: isActive ? '#00d2ff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.92rem',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                borderLeft: isActive ? '3px solid #00d2ff' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* System Health Status Indicator */}
      <div className="glass-panel" style={{ padding: '14px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>Engine Status</span>
          <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>
            {sysHealth ? 'ONLINE' : 'CONNECTING'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={12} color="#00f5d4" />
            <span>AES-256-GCM Authenticated</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={12} color="#00f5d4" />
            <span>Shamir GF(p) Threshold (2,3)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={12} color="#00f5d4" />
            <span>Isolated AI Trust Boundary</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
