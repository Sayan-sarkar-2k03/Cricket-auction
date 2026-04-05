import React, { useState, useEffect } from 'react';
import { fetchApi, formatCurrency, API_BASE_URL, getDriveDirectUrl } from '../api/config';
import { Users, Plus, Save, X, Download, Pencil, Trash2, Crown, MoveUp, MoveDown, LayoutList } from 'lucide-react';

const TeamsList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', total_purse: '', max_players: 15, logo_url: '', owner: '' });
  const [activeSquadTeam, setActiveSquadTeam] = useState(null);
  const [squadPlayers, setSquadPlayers] = useState([]);

  const loadTeams = async () => {
    try {
      const result = await fetchApi('/teams');
      setTeams(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', total_purse: '', max_players: 15, logo_url: '', owner: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (team) => {
    setEditingId(team.id);
    setFormData({
      name: team.name,
      total_purse: team.total_purse,
      max_players: team.max_players,
      logo_url: team.logo_url || '',
      owner: team.owner || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team? Ensure no players are assigned first.")) return;
    try {
      await fetchApi(`/teams/${id}`, { method: 'DELETE' });
      loadTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        total_purse: parseFloat(formData.total_purse),
        max_players: parseInt(formData.max_players, 10),
        logo_url: formData.logo_url || null,
        owner: formData.owner || null
      };

      if (editingId) {
        await fetchApi(`/teams/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/teams', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      resetForm();
      loadTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleManageSquad = async (team) => {
    setActiveSquadTeam(team);
    try {
      const allPlayers = await fetchApi('/players');
      const filtered = allPlayers.filter(p => p.current_team_id === team.id)
                        .sort((a,b) => (a.batting_order || 99) - (b.batting_order || 99));
      setSquadPlayers(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetCaptain = async (playerId) => {
    try {
      await fetchApi(`/players/${playerId}/set-captain`, { method: 'POST' });
      handleManageSquad(activeSquadTeam);
    } catch (err) {
      alert(err.message);
    }
  };

  const movePlayer = async (index, direction) => {
    const newSquad = [...squadPlayers];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSquad.length) return;
    
    [newSquad[index], newSquad[targetIndex]] = [newSquad[targetIndex], newSquad[index]];
    
    const orders = newSquad.map((p, idx) => ({ player_id: p.id, index: idx + 1 }));
    try {
      await fetchApi('/players/reorder-batting', {
        method: 'POST',
        body: JSON.stringify(orders)
      });
      setSquadPlayers(newSquad);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="container animate-fade-in"><p>Loading teams...</p></div>;

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users className="text-accent-primary" /> Franchises
        </h2>
        <button className="btn btn-primary" onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? <X size={20} /> : <Plus size={20} />} {showForm ? 'Cancel' : 'Add Team'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Franchise' : 'Add New Franchise'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Team Name</label>
              <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Total Purse</label>
              <input type="number" className="input-field" required min="0" value={formData.total_purse} onChange={e => setFormData({...formData, total_purse: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Max Players</label>
              <input type="number" className="input-field" required min="1" value={formData.max_players} onChange={e => setFormData({...formData, max_players: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Logo URL (Optional)</label>
              <input type="url" className="input-field" value={formData.logo_url} onChange={e => setFormData({...formData, logo_url: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Owner Name (Optional)</label>
              <input type="text" className="input-field" value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success"><Save size={20} /> Save Team</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {teams.map(team => (
          <div key={team.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {team.logo_url ? (
                <img src={getDriveDirectUrl(team.logo_url)} alt={team.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {team.name.charAt(0)}
                </div>
              )}
              <div>
                <h4 style={{ fontSize: '1.25rem', margin: 0 }}>{team.name}</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Max Squad: {team.max_players}</p>
                  {team.owner && <p style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', margin: 0 }}>Owner: {team.owner}</p>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button 
                   onClick={() => handleEdit(team)} 
                   style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                   title="Edit Team"
                 >
                   <Pencil size={16} />
                 </button>
                 <button 
                   onClick={() => handleDelete(team.id)} 
                   style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                   title="Delete Team"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', gap: '2rem' }}>
               <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Purse</p>
                  <p style={{ fontWeight: 600 }}>{formatCurrency(team.total_purse)}</p>
               </div>
               <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Remaining</p>
                  <p style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(team.remaining_purse)}</p>
               </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => handleManageSquad(team)} className="btn btn-outline" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LayoutList size={16} /> <span style={{ fontSize: '0.8rem' }}>Manage Squad</span>
                  </button>
                  <a href={`${API_BASE_URL}/teams/${team.id}/export-excel`} download className="btn btn-outline" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Download size={16} /> <span style={{ fontSize: '0.8rem' }}>Excel</span>
                  </a>
                </div>
               </div>
            </div>
          </div>
        ))}
        {teams.length === 0 && <p>No teams found. Add one above or upload a CSV in Settings.</p>}
      </div>

      {activeSquadTeam && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-elevated)', paddingBottom: '1rem' }}>
               <h3 style={{ margin: 0 }}>Manage Squad: {activeSquadTeam.name}</h3>
               <button onClick={() => setActiveSquadTeam(null)} className="btn btn-outline" style={{ padding: '0.4rem', minWidth: '40px' }}><X size={20}/></button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Order</th>
                  <th style={{ padding: '1rem' }}>Player</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {squadPlayers.map((player, idx) => (
                  <tr key={player.id} style={{ borderBottom: '1px solid var(--bg-elevated)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '1rem' }}>{idx + 1}</td>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {player.is_captain === 1 && <Crown size={16} className="text-accent-primary" />}
                        {player.name}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{player.profile}</td>
                    <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleSetCaptain(player.id)} className={`btn ${player.is_captain ? 'btn-success' : 'btn-outline'}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                                {player.is_captain ? 'Captain' : 'Set Capt'}
                            </button>
                            <button onClick={() => movePlayer(idx, -1)} disabled={idx === 0} className="btn btn-outline" style={{ padding: '0.3rem' }}><MoveUp size={14} /></button>
                            <button onClick={() => movePlayer(idx, 1)} disabled={idx === squadPlayers.length - 1} className="btn btn-outline" style={{ padding: '0.3rem' }}><MoveDown size={14} /></button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {squadPlayers.length === 0 && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Squad is empty. Start bidding!</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsList;
