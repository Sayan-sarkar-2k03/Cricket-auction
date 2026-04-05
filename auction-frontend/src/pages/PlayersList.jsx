import React, { useState, useEffect } from 'react';
import { fetchApi, formatCurrency, getDriveDirectUrl } from '../api/config';
import { UserPlus, Save, X, Search, Filter, Pencil, Trash2 } from 'lucide-react';

const PlayersList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', base_price: '', gender: 'Male', profile: 'Batsman', previous_score: '', video_url: '', photo_url: '' 
  });

  const loadPlayers = async () => {
    try {
      const result = await fetchApi('/players');
      setPlayers(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', base_price: '', gender: 'Male', profile: 'Batsman', previous_score: '', video_url: '', photo_url: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (player) => {
    setEditingId(player.id);
    setFormData({
      name: player.name,
      base_price: player.base_price,
      gender: player.gender || 'Male',
      profile: player.profile || 'Batsman',
      previous_score: player.previous_score || '',
      video_url: player.video_url || '',
      photo_url: player.photo_url || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return;
    try {
      await fetchApi(`/players/${id}`, { method: 'DELETE' });
      loadPlayers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        base_price: parseFloat(formData.base_price),
        gender: formData.gender,
        profile: formData.profile,
        previous_score: formData.previous_score,
        video_url: formData.video_url || null,
        photo_url: formData.photo_url || null
      };

      if (editingId) {
        await fetchApi(`/players/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/players', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      resetForm();
      loadPlayers();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="container animate-fade-in"><p>Loading players...</p></div>;

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus className="text-accent-primary" /> Player Directory
        </h2>
        <button className="btn btn-primary" onClick={() => { if(showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? <X size={20} /> : <UserPlus size={20} />} {showForm ? 'Close' : 'Add Player'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Player' : 'Add New Player'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Player Name</label>
              <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Base Price</label>
              <input type="number" className="input-field" required min="0" value={formData.base_price} onChange={e => setFormData({...formData, base_price: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Role/Profile</label>
              <select className="input-field" value={formData.profile} onChange={e => setFormData({...formData, profile: e.target.value})}>
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Previous Score / Stats</label>
              <input type="text" className="input-field" value={formData.previous_score} onChange={e => setFormData({...formData, previous_score: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Gender</label>
              <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Intro Video URL (Optional)</label>
              <input type="url" className="input-field" placeholder="https://..." value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Photo URL (Optional)</label>
              <input type="url" className="input-field" placeholder="https://..." value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success"><Save size={20} /> Save Player</button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '500px' }}>
           <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
           <input 
             type="text" 
             className="input-field" 
             placeholder="Search players by name..." 
             style={{ paddingLeft: '3rem', width: '100%', background: 'rgba(0,0,0,0.3)' }}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', alignItems: 'center' }}>
           <Filter size={16} /> Filter options in next iteration
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filteredPlayers.map(player => (
          <div key={player.id} className="glass-card" style={{ 
            borderLeft: `4px solid ${player.status === 'Available' ? 'var(--accent-primary)' : player.status === 'Sold' ? 'var(--success)' : 'var(--danger)'}`
          }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
               {player.photo_url ? (
                 <img 
                   src={getDriveDirectUrl(player.photo_url)} 
                   alt={player.name} 
                   onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                   style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} 
                 />
               ) : null}
               <div style={{ 
                 width: '64px', height: '64px', borderRadius: '50%', 
                 background: 'var(--bg-elevated)', border: '2px solid var(--border-glass)',
                 display: player.photo_url ? 'none' : 'flex', 
                 alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' 
               }}>
                 {player.name.charAt(0)}
               </div>
               <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                     {player.name}
                     <span style={{ 
                       fontSize: '0.7rem', 
                       padding: '0.1rem 0.5rem', 
                       borderRadius: '10px', 
                       background: player.status === 'Available' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                       color: player.status === 'Available' ? 'var(--accent-primary)' : 'var(--success)',
                       height: 'fit-content'
                     }}>{player.status}</span>
                  </h4>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{player.profile} &bull; {player.gender}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button 
                     onClick={() => handleEdit(player)} 
                     style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                     title="Edit Player"
                   >
                     <Pencil size={16} />
                   </button>
                   <button 
                     onClick={() => handleDelete(player.id)} 
                     style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                     title="Delete Player"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
             </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
               <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Base Price</p>
                  <p style={{ fontWeight: 600 }}>{formatCurrency(player.base_price)}</p>
               </div>
               {player.sold_price && (
                 <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sold Price</p>
                    <p style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(player.sold_price)}</p>
                 </div>
               )}
               {player.previous_score && (
                 <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Previous Stats</p>
                    <p style={{ fontSize: '0.875rem' }}>{player.previous_score}</p>
                 </div>
               )}
            </div>
          </div>
        ))}
        {filteredPlayers.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>No players found in the directory.</p>}
      </div>
    </div>
  );
};

export default PlayersList;
