import React, { useState, useEffect, useRef } from 'react';
import { fetchApi, formatCurrency, getDriveDirectUrl } from '../api/config';
import { Gavel, PlayCircle, CheckCircle, TrendingUp, AlertCircle, Users, Wallet, RefreshCw, Shuffle } from 'lucide-react';

const AuctionRoom = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState({ 
    bid_increments: [5, 10, 15, 20, 50], 
    currency_symbol: '$',
    min_players: 11,
    min_base_price: 5.0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedIncrement, setSelectedIncrement] = useState(5);
  const [videoError, setVideoError] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, teamsRes, settingsRes] = await Promise.all([
          fetchApi('/players'),
          fetchApi('/teams'),
          fetchApi('/settings')
        ]);

        const available = playersRes.filter(p => p.status?.toString().toLowerCase() !== 'sold');
        // Shuffle the available players list
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        setPlayers(shuffled);
        setTeams(teamsRes);
        setSettings(settingsRes || settings);
        if (settingsRes?.bid_increments?.length > 0) {
          setSelectedIncrement(settingsRes.bid_increments[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Poll for updates if a player is being auctioned
  useEffect(() => {
    if (!selectedPlayerId) return;

    const interval = setInterval(async () => {
      try {
        const [playerRes, teamsRes] = await Promise.all([
          fetchApi(`/players`), // This might return all players, better if we have /players/{id}
          fetchApi('/teams')
        ]);
        
        // Update the specific active player from the list
        setPlayers(prev => {
          const updated = playerRes.find(p => p.id === parseInt(selectedPlayerId));
          if (updated) {
            return prev.map(p => p.id === updated.id ? updated : p);
          }
          return prev;
        });
        setTeams(teamsRes);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // 2 second refresh for bids

    return () => clearInterval(interval);
  }, [selectedPlayerId]);

  const currentPlayer = players.find(p => Number(p.id) === Number(selectedPlayerId));
  
  const pickRandomPlayer = () => {
    const available = players.filter(p => (p.status?.toString().toLowerCase() === 'available' || !p.status) && p.id !== currentPlayer?.id);
    if (available.length === 0) {
      alert("No more available players to pick.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    setSelectedPlayerId(available[randomIndex].id);
  };

  const getNextBidAmount = () => {
    if (!currentPlayer) return 0;
    if (currentPlayer.current_bid === 0) return currentPlayer.base_price;
    return currentPlayer.current_bid + selectedIncrement;
  };

  const handlePlaceBid = async (teamId) => {
    const nextBid = getNextBidAmount();
    try {
      await fetchApi('/bids/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: currentPlayer.id,
          team_id: teamId,
          amount: nextBid
        })
      });

      // Refresh data immediately
      const [pRes, tRes] = await Promise.all([fetchApi('/players'), fetchApi('/teams')]);
      setPlayers(pRes.filter(p => p.status?.toString().toLowerCase() !== 'sold'));
      setTeams(tRes);

    } catch (err) {
      alert(err.message || "Failed to place bid");
    }
  };

  const handleSellPlayer = async () => {
    if (!currentPlayer || !currentPlayer.leading_team_id) {
      alert("No leading bid to finalize.");
      return;
    }

    try {
      await fetchApi(`/bids/sell?player_id=${currentPlayer.id}`, {
        method: 'POST'
      });

      const leader = teams.find(t => t.id === currentPlayer.leading_team_id);
      alert(`${currentPlayer.name} SOLD to ${leader?.name} for ${formatCurrency(currentPlayer.current_bid, settings.currency_symbol)}!`);

      // Cleanup
      setPlayers(players.filter(p => p.id !== currentPlayer.id));
      setSelectedPlayerId('');
      
      const teamsRes = await fetchApi('/teams');
      setTeams(teamsRes);

    } catch (err) {
      alert(`Error finalizing sale: ${err.message}`);
    }
  };

  const checkBidEligibility = (team) => {
    if (!currentPlayer) return { eligible: false };
    if (currentPlayer.leading_team_id === team.id) return { eligible: false, reason: "Already Leading" };
    
    const nextBid = getNextBidAmount();
    
    // Reserve check
    const squadSize = players.filter(p => p.current_team_id === team.id || (p.status === 'Sold' && p.current_team_id === team.id)).length;
    // Note: This squadSize calculation might be slightly off if only available players are in state. 
    // Ideally the backend should return the squad count for each team.
    // For now we use team objects if they have player_count (let's assume they don't yet, so we count from players)
    // Actually, let's assume the team object has been updated to include current player count if possible.
    // Since we don't have that, we'll just check purse.
    
    // Mandatory Reserve logic (approximate on frontend, enforced on backend)
    const needed = Math.max(0, settings.min_players - (team.player_count || 0) - 1);
    const reserve = needed * settings.min_base_price;
    
    if (team.remaining_purse - nextBid < reserve) {
      return { eligible: false, reason: "Purse Reserve" };
    }
    
    if (team.remaining_purse < nextBid) {
      return { eligible: false, reason: "Insufficient Purse" };
    }

    return { eligible: true };
  };

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    
    // Check for Google Drive video
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    
    // Check for YouTube video
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const youtubeMatch = url.match(regExp);
    if (youtubeMatch && youtubeMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${youtubeMatch[2]}?autoplay=1&mute=1&loop=1&playlist=${youtubeMatch[2]}`;
    }
    
    return null;
  };

  const renderMedia = () => {
    if (!currentPlayer) return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        <PlayCircle size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <p style={{ fontSize: '1.25rem' }}>Waiting for player selection...</p>
      </div>
    );

    const videoEmbedUrl = getVideoEmbedUrl(currentPlayer.video_url);

    if (videoEmbedUrl && !videoError) {
      return (
        <iframe
          src={videoEmbedUrl}
          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          onError={() => setVideoError(true)}
        />
      );
    }

    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', padding: '2rem' }}>
        {currentPlayer.photo_url ? (
          <img 
            src={getDriveDirectUrl(currentPlayer.photo_url)} 
            alt={currentPlayer.name} 
            style={{ width: '220px', height: '220px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-primary)', marginBottom: '1.5rem' }} 
          />
        ) : (
          <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
            {currentPlayer.name.charAt(0)}
          </div>
        )}
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: 0 }}>{currentPlayer.name}</h1>
        <p style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', fontWeight: 600 }}>{currentPlayer.profile}</p>
      </div>
    );
  };

  if (loading) return <div className="container animate-fade-in"><p>Entering Auction Room...</p></div>;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1600px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
          <Gavel size={36} className="text-accent-primary" />
          IPL Live Auction
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Step Increment:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {settings.bid_increments.map(inc => (
                    <button 
                        key={inc} 
                        className={`btn ${selectedIncrement === inc ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.25rem 0.75rem' }}
                        onClick={() => setSelectedIncrement(inc)}
                    >
                        {inc}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr 400px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left: Player Selection & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Next Player</h3>
                <button 
                    className="btn btn-outline" 
                    title="Pick Random Player"
                    onClick={pickRandomPlayer}
                    style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '40px', height: '40px' }}
                >
                    <Shuffle size={18} />
                </button>
            </div>
            <select
              className="input-field"
              style={{ width: '100%' }}
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">-- Choose Player --</option>
              {players.filter(p => p.status !== 'Sold').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.profile})</option>
              ))}
            </select>
          </div>

          {currentPlayer && (
            <div className="glass-card animate-fade-in">
              <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{currentPlayer.name}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span className="badge badge-primary">{currentPlayer.profile}</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{currentPlayer.gender}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>BASE PRICE</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(currentPlayer.base_price, settings.currency_symbol)}</p>
              </div>
              <button 
                className="btn btn-success" 
                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                onClick={handleSellPlayer}
                disabled={!currentPlayer.leading_team_id}
              >
                <CheckCircle size={20} /> SOLD for {formatCurrency(currentPlayer.current_bid || currentPlayer.base_price, settings.currency_symbol)}
              </button>
            </div>
          )}
        </div>

        {/* Center: Live Bidding Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: '600px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            {renderMedia()}
            
            {currentPlayer && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, transparent 100%)', padding: '4rem 2rem 2rem' }}>
                <p style={{ color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '2px' }}>CURRENT BID</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <p style={{ fontSize: '5rem', fontWeight: 800, margin: 0 }}>{formatCurrency(currentPlayer.current_bid || currentPlayer.base_price, settings.currency_symbol)}</p>
                    {currentPlayer.leading_team_id && (
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>LEADING FRANCHISE</p>
                            <h4 style={{ fontSize: '2rem', margin: 0 }}>{teams.find(t => t.id === currentPlayer.leading_team_id)?.name}</h4>
                        </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Franchise Bidding Console */}
        <div className="glass-card" style={{ height: 'calc(100vh - 200px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={20} /> Franchises
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teams.map(team => {
              const { eligible, reason } = checkBidEligibility(team);
              const isLeader = currentPlayer?.leading_team_id === team.id;
              
              return (
                <div key={team.id} className="glass-card" style={{ 
                    padding: '1rem', 
                    border: isLeader ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.05)',
                    background: isLeader ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0 }}>{team.name}</h4>
                    {isLeader && <span className="badge badge-primary pulse">LEADER</span>}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Wallet size={12} style={{ marginRight: '4px' }} />
                        {formatCurrency(team.remaining_purse, settings.currency_symbol)}
                    </div>
                  </div>

                  <button 
                    className={`btn ${eligible ? 'btn-primary' : 'btn-outline'}`}
                    style={{ width: '100%', padding: '0.5rem' }}
                    onClick={() => handlePlaceBid(team.id)}
                    disabled={!eligible || !currentPlayer}
                  >
                    {eligible ? `BID ${formatCurrency(getNextBidAmount(), settings.currency_symbol)}` : (reason || 'WAIT')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuctionRoom;
