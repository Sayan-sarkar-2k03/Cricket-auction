import React, { useState, useEffect } from 'react';
import { fetchApi, formatCurrency, getDriveDirectUrl } from '../api/config';
import { Users, DollarSign, UserCheck, UserX } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
    <div style={{ 
      background: `rgba(${color}, 0.1)`, 
      padding: '1rem', 
      borderRadius: 'var(--radius-md)',
      color: `rgb(${color})`
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await fetchApi('/dashboard');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="container animate-fade-in"><p>Loading dashboard...</p></div>;
  if (error) return <div className="container animate-fade-in"><div className="glass-card" style={{ borderColor: 'var(--danger)' }}><p style={{ color: 'var(--danger)' }}>{error}</p></div></div>;

  return (
    <div className="container animate-fade-in">
      <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users className="text-accent-primary" /> Dashboard Overview
      </h2>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard title="Total Players" value={data.total_players} icon={<Users size={28} />} color="59, 130, 246" /> {/* Blue */}
        <StatCard title="Sold" value={data.sold_players} icon={<UserCheck size={28} />} color="16, 185, 129" /> {/* Green */}
        <StatCard title="Unsold" value={data.unsold_players} icon={<UserX size={28} />} color="244, 63, 94" /> {/* Red */}
        <StatCard title="Total Teams" value={data.teams.length} icon={<DollarSign size={28} />} color="139, 92, 246" /> {/* Purple */}
      </div>

      {/* Teams Grid */}
      <h3 style={{ marginBottom: '1.5rem' }}>Franchise Status</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {data.teams.map(team => (
          <div key={team.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {team.logo_url ? (
                  <img src={getDriveDirectUrl(team.logo_url)} alt={team.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {team.name.charAt(0)}
                  </div>
                )}
                <h4 style={{ fontSize: '1.25rem' }}>{team.name}</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Remaining Purse</p>
                <p style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(team.remaining_purse)}</p>
              </div>
            </div>
            
            {/* Progress Bar for Purse */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
               <div style={{ 
                 height: '100%', 
                 background: 'var(--success)', 
                 width: `${(team.remaining_purse / team.total_purse) * 100}%` 
               }}></div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Completed Roster: {team.players?.length || 0} / {team.max_players}
            </p>
          </div>
        ))}
        {data.teams.length === 0 && (
          <p style={{ color: 'var(--text-secondary)' }}>No teams configured yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
