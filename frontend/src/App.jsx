import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SecureChatPage } from './pages/SecureChatPage';
import { EncryptionLabPage } from './pages/EncryptionLabPage';
import { SecretSharingLabPage } from './pages/SecretSharingLabPage';
import { SecurityMonitorPage } from './pages/SecurityMonitorPage';
import { api } from './services/api';

export function App() {
  const [activePage, setActivePage] = useState('landing');
  const [sysHealth, setSysHealth] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        setSysHealth(res);
      } catch (err) {
        setSysHealth(null);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderActivePage = () => {
    switch (activePage) {
      case 'landing':
        return <LandingPage onStartSession={() => setActivePage('chat')} />;
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'chat':
        return <SecureChatPage />;
      case 'encryption':
        return <EncryptionLabPage />;
      case 'secret-sharing':
        return <SecretSharingLabPage />;
      case 'monitor':
        return <SecurityMonitorPage />;
      default:
        return <LandingPage onStartSession={() => setActivePage('chat')} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        sysHealth={sysHealth} 
      />
      <main className="main-content">
        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;
