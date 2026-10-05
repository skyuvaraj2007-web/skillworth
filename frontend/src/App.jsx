import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import LearnerDashboard from './pages/LearnerDashboard';
import InstitutionPortal from './pages/InstitutionPortal';
import IndustryPortal from './pages/IndustryPortal';

export default function App() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('landing');

  if (loading) {
    return (
      <div className="sw-loading-screen">
        <div className="sw-brand-icon" style={{ animation: 'spin 1.5s infinite linear' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#1a73e8' }}>refresh</span>
        </div>
        <p style={{ marginTop: '16px', color: '#5f6368', fontWeight: 500 }}>Initializing SkillWorth Platform...</p>
      </div>
    );
  }

  return (
    <div className="sw-app-root">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="sw-main-content">
        {activePage === 'landing' && <LandingPage setActivePage={setActivePage} />}
        {activePage === 'register' && <RegisterPage setActivePage={setActivePage} />}
        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
        {activePage === 'learner' && <LearnerDashboard setActivePage={setActivePage} />}
        {activePage === 'institution' && <InstitutionPortal setActivePage={setActivePage} />}
        {activePage === 'industry' && <IndustryPortal setActivePage={setActivePage} />}
        {activePage === 'verify' && <IndustryPortal setActivePage={setActivePage} />}
      </main>

      <Footer />
    </div>
  );
}
