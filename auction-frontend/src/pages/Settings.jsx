import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api/config';
import { Settings as SettingsIcon, Upload, Save, CheckCircle, Activity, RefreshCw } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({ bid_increments: [5, 10, 15, 20, 50], currency_symbol: '$' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // File upload states
  const [teamsFile, setTeamsFile] = useState(null);
  const [playersFile, setPlayersFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: null, message: '' });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await fetchApi('/settings');
        setSettings(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const loadLogs = async () => {
      try {
        const result = await fetchApi('/logs?limit=50');
        setLogs(result);
      } catch (err) {
        console.error(err);
      }
    };

    loadSettings();
    loadLogs();
  }, []);

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (err) {
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    e.preventDefault();
    const file = type === 'teams' ? teamsFile : playersFile;
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus({ type, message: 'Uploading...' });

    try {
      // Intentionally not using fetchApi because we need to send FormData explicitly without Content-Type json
      const response = await fetch(`http://localhost:8000/api/${type}/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const result = await response.json();
      setUploadStatus({ type, message: result.message || 'Success!' });
      
      // Clear file inputs
      if (type === 'teams') setTeamsFile(null);
      if (type === 'players') setPlayersFile(null);
      
    } catch (err) {
      setUploadStatus({ type, message: `Error: ${err.message}` });
    }
  };

  const handleRefreshLogs = async () => {
    setLoadingLogs(true);
    try {
      const result = await fetchApi('/logs?limit=50');
      setLogs(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loading) return <div className="container animate-fade-in"><p>Loading settings...</p></div>;

  return (
    <div className="container animate-fade-in">
      <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SettingsIcon className="text-accent-primary" /> Application Settings
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Global Configuration */}
        <div className="glass-card">
           <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Global Preferences</h3>
           <form onSubmit={handleSettingsSave}>
             <div className="input-group">
                <label className="input-label">Currency Symbol</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.currency_symbol} 
                  onChange={e => setSettings({...settings, currency_symbol: e.target.value})} 
                  maxLength={5}
                />
             </div>
             
             <div className="input-group">
                <label className="input-label">Quick Bid Increments (Comma separated)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={settings.bid_increments.join(', ')} 
                  onChange={e => {
                    const vals = e.target.value.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n));
                    setSettings({...settings, bid_increments: vals.length ? vals : [5] });
                  }} 
                  placeholder="e.g., 5, 10, 15, 20, 50"
                  title="These values will populate the quick bid buttons in the auction room."
                />
             </div>
             
             <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={saving}>
               <Save size={20} /> {saving ? 'Saving...' : 'Save Settings'}
             </button>
           </form>
        </div>

        {/* Data Import */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Import Franchises</h3>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: ' var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Expected CSV Headers:</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.25rem' }}>Required</th>
                    <th style={{ padding: '0.25rem' }}>Optional</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.25rem' }}><code>name, total_purse</code></td>
                    <td style={{ padding: '0.25rem' }}><code>owner, logo_url, max_players</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <form onSubmit={(e) => handleFileUpload(e, 'teams')} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <input 
                type="file" 
                accept=".csv" 
                className="input-field" 
                onChange={(e) => setTeamsFile(e.target.files[0])}
                style={{ background: 'rgba(0,0,0,0.2)', cursor: 'pointer', padding: '0.5rem' }}
              />
              <button 
                type="submit" 
                className={`btn ${teamsFile ? 'btn-primary' : 'btn-outline'}`} 
                disabled={!teamsFile}
              >
                <Upload size={18} /> Upload Teams CSV
              </button>
              {uploadStatus.type === 'teams' && (
                <p style={{ 
                  color: uploadStatus.message.includes('Error') ? 'var(--danger)' : 'var(--success)', 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' 
                }}>
                  {!uploadStatus.message.includes('Error') && !uploadStatus.message.includes('Uploading') && <CheckCircle size={16} />} 
                  {uploadStatus.message}
                </p>
              )}
            </form>
          </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Import Players</h3>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: ' var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Expected CSV Headers:</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.25rem' }}>Required</th>
                    <th style={{ padding: '0.25rem' }}>Optional</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.25rem' }}><code>name, base_price</code></td>
                    <td style={{ padding: '0.25rem' }}><code>gender, profile, previous_score, video_url, photo_url</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <form onSubmit={(e) => handleFileUpload(e, 'players')} style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <input 
                type="file" 
                accept=".csv" 
                className="input-field" 
                onChange={(e) => setPlayersFile(e.target.files[0])}
                style={{ background: 'rgba(0,0,0,0.2)', cursor: 'pointer', padding: '0.5rem' }}
              />
              <button 
                type="submit" 
                className={`btn ${playersFile ? 'btn-primary' : 'btn-outline'}`} 
                disabled={!playersFile}
              >
                <Upload size={18} /> Upload Players CSV
              </button>
              {uploadStatus.type === 'players' && (
                <p style={{ 
                  color: uploadStatus.message.includes('Error') ? 'var(--danger)' : 'var(--success)', 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' 
                }}>
                  {!uploadStatus.message.includes('Error') && !uploadStatus.message.includes('Uploading') && <CheckCircle size={16} />} 
                  {uploadStatus.message}
                </p>
              )}
            </form>
          </div>

        </div>

        {/* System Logs */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Activity className="text-accent-primary" /> System Logs (Recent Clicks)
            </h3>
            <button onClick={handleRefreshLogs} className="btn btn-outline" style={{ padding: '0.5rem' }} disabled={loadingLogs}>
              <RefreshCw size={16} className={loadingLogs ? 'spin' : ''} /> {loadingLogs ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            {logs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No logs recorded yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.5rem', width: '200px' }}>Timestamp</th>
                    <th style={{ padding: '0.5rem', width: '150px' }}>Action</th>
                    <th style={{ padding: '0.5rem' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '0.5rem' }}><span style={{ padding: '0.2rem 0.5rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', borderRadius: '10px', fontSize: '0.75rem' }}>{log.action_type}</span></td>
                      <td style={{ padding: '0.5rem', fontSize: '0.875rem' }}>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
