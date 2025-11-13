import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GameLibrary.css';

const API_BASE_URL = 'http://localhost:3001/api';

function GameLibrary({ token, onClose }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [stats, setStats] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Fetch library games
  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {
        search: searchTerm || undefined,
        type: filterType !== 'all' ? filterType : undefined,
        sortBy,
        sortOrder: 'desc',
        limit: 50
      };

      const response = await axios.get(`${API_BASE_URL}/library/games`, {
        headers,
        params
      });

      if (response.data.success) {
        setGames(response.data.games);
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError(err.response?.data?.error || 'Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_BASE_URL}/library/stats`, { headers });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGames();
    fetchStats();
  }, []);

  // Reload on filter/search/sort change
  useEffect(() => {
    fetchGames();
  }, [searchTerm, filterType, sortBy]);

  // Handle play game
  const handlePlayGame = (game) => {
    setSelectedGame(game);
    setShowPlayer(true);
  };

  // Handle delete game
  const handleDeleteGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this game from your library?')) {
      return;
    }

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${API_BASE_URL}/library/games/${gameId}`, { headers });

      // Refresh list
      fetchGames();
      fetchStats();
    } catch (err) {
      alert('Failed to delete game: ' + err.message);
    }
  };

  // Handle download game
  const handleDownloadGame = async (gameId, title) => {
    try {
      const downloadUrl = `${API_BASE_URL.replace('/api', '')}/api/library/games/${gameId}/play`;
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert('Failed to download game: ' + err.message);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get game type icon
  const getTypeIcon = (type) => {
    const icons = {
      platformer: '🏃',
      rpg: '⚔️',
      puzzle: '🧩',
      unknown: '🎮'
    };
    return icons[type] || icons.unknown;
  };

  if (showPlayer && selectedGame) {
    return (
      <div className="game-player-fullscreen">
        <div className="player-header">
          <h2>{selectedGame.title}</h2>
          <button className="close-player-btn" onClick={() => setShowPlayer(false)}>
            ✕ Close
          </button>
        </div>
        <iframe
          src={`${API_BASE_URL.replace('/api', '')}/api/library/games/${selectedGame.id}/play`}
          title={selectedGame.title}
          sandbox="allow-scripts allow-same-origin"
          className="game-iframe"
        />
      </div>
    );
  }

  return (
    <div className="game-library">
      <header className="library-header">
        <div className="library-title-section">
          <h1>📚 Game Library</h1>
          {onClose && (
            <button className="close-library-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        {stats && (
          <div className="library-stats">
            <div className="stat-card">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Games</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.totalPlays}</span>
              <span className="stat-label">Plays</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.totalDownloads}</span>
              <span className="stat-label">Downloads</span>
            </div>
          </div>
        )}
      </header>

      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="platformer">Platformer</option>
            <option value="rpg">RPG</option>
            <option value="puzzle">Puzzle</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="createdAt">Newest First</option>
            <option value="playCount">Most Played</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="library-loading">
          <div className="spinner"></div>
          <p>Loading library...</p>
        </div>
      )}

      {error && (
        <div className="library-error">
          <p>{error}</p>
          <button onClick={fetchGames} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="library-empty">
          <h3>No games in your library yet</h3>
          <p>Generate games and save them to build your collection!</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="games-grid">
          {games.map(game => (
            <div key={game.id} className="game-card">
              <div className="game-card-header">
                <span className="game-type-badge">
                  {getTypeIcon(game.type)} {game.type}
                </span>
                {game.apiUsed && (
                  <span className="game-api-badge">{game.apiUsed}</span>
                )}
              </div>

              <div className="game-card-body">
                <h3 className="game-title">{game.title}</h3>
                <p className="game-description">{game.description}</p>

                <div className="game-metadata">
                  <span className="game-date">📅 {formatDate(game.createdAt)}</span>
                  <span className="game-plays">▶️ {game.playCount} plays</span>
                </div>

                {game.tags && game.tags.length > 0 && (
                  <div className="game-tags">
                    {game.tags.map((tag, idx) => (
                      <span key={idx} className="game-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="game-card-actions">
                <button
                  onClick={() => handlePlayGame(game)}
                  className="btn btn-primary btn-small"
                >
                  ▶️ Play
                </button>
                <button
                  onClick={() => handleDownloadGame(game.id, game.title)}
                  className="btn btn-secondary btn-small"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleDeleteGame(game.id)}
                  className="btn btn-danger btn-small"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameLibrary;
