import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings as SettingsIcon, LayoutDashboard, Gavel } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import TeamsList from './pages/TeamsList';
import PlayersList from './pages/PlayersList';
import AuctionRoom from './pages/AuctionRoom';
import Settings from './pages/Settings';

const Navigation = () => {
  const location = useLocation();
  if (location.pathname === '/') return null; // Hide nav on landing page

  return (
    <nav style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      borderBottom: 'var(--border-glass)',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Gavel size={28} color="var(--accent-primary)" />
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '1px' }}>
          AUCTION<span style={{ color: 'var(--accent-primary)' }}>PRO</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <NavLink to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" current={location.pathname} />
        <NavLink to="/teams" icon={<Users size={20} />} label="Teams" current={location.pathname} />
        <NavLink to="/players" icon={<Users size={20} />} label="Players" current={location.pathname} />
        <NavLink to="/auction" icon={<Gavel size={20} />} label="Auction Room" current={location.pathname} />
        <NavLink to="/settings" icon={<SettingsIcon size={20} />} label="Settings" current={location.pathname} />
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label, current }) => {
  const isActive = current.startsWith(to);
  return (
    <Link to={to} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
      fontWeight: isActive ? 600 : 500,
      textShadow: isActive ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
    }}>
      {icon} {label}
    </Link>
  );
};

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const handleClick = (e) => {
      let description = e.target.tagName;
      if (e.target.innerText && e.target.innerText.trim() !== '') {
        // limit text length to avoid huge logs
        description = e.target.innerText.trim().substring(0, 50);
      } else if (e.target.alt) {
        description = `Image: ${e.target.alt}`;
      } else if (e.target.placeholder) {
        description = `Input: ${e.target.placeholder}`;
      }
      
      fetch('http://localhost:8000/api/logs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'click',
          description: description
        })
      }).catch(() => { /* Ignore errors to avoid console spam */ });
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams" element={<TeamsList />} />
            <Route path="/players" element={<PlayersList />} />
            <Route path="/auction" element={<AuctionRoom />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
