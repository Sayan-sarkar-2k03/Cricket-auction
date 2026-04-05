import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, Users, Trophy } from 'lucide-react';

const LandingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80vw',
        height: '80vw',
        maxHeight: '800px',
        maxWidth: '800px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      <div className="animate-fade-in" style={{ zIndex: 1, maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
           <Gavel size={64} className="pulse-primary" color="var(--accent-primary)" style={{ borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem' }} />
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(3rem, 8vw, 5rem)', 
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #fff, var(--text-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Premium Player <br/>
          <span style={{ color: 'var(--accent-primary)', WebkitTextFillColor: 'var(--accent-primary)' }}>Auction System</span>
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Experience the thrill of the auction room. Manage franchises, browse the player pool, and engage in live bidding with our state-of-the-art platform.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
             <LayoutDashboard size={20} /> Enter Dashboard
          </Link>
          <Link to="/auction" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', borderColor: 'var(--accent-secondary)', color: '#fff' }}>
             <Gavel size={20} color="var(--accent-secondary)" /> Straight to Auction
          </Link>
        </div>
        
        {/* Features cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '5rem', textAlign: 'left' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <Trophy size={32} color="var(--warning)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ marginBottom: '0.5rem' }}>Live Bidding</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Real-time updates and dynamic custom increments.</p>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <Users size={32} color="var(--success)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ marginBottom: '0.5rem' }}>Franchise Management</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Track purses, view squads, and build your dream team.</p>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
             <h3 style={{ marginBottom: '0.5rem' }}>CSV Integration</h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Bulk load players and teams seamlessly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick fix for Missing icon import
import { LayoutDashboard } from 'lucide-react';

export default LandingPage;
