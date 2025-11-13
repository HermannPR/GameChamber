import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import GameCatalogue from './GameCatalogue';
import ProgressDashboard from './ProgressDashboard';
import AdminDashboard from './AdminDashboard';
import './App.css';

const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';

function App() {
  // State management
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    claude: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showApiSetup, setShowApiSetup] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });

  // WebSocket ref
  const socketRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    socketRef.current = io(WS_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socketRef.current.on('jobUpdate', (data) => {
      console.log('Job update:', data);
      if (data.jobId === currentJobId) {
        setJobStatus(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress || prev?.progress,
          result: data.result || prev?.result,
          error: data.error || prev?.error
        }));

        if (data.status === 'completed') {
          setIsGenerating(false);
        } else if (data.status === 'failed') {
          setIsGenerating(false);
          setError(data.error || 'Generation failed');
        }
      }
    });

    socketRef.current.on('stageUpdate', (data) => {
      console.log('Stage update:', data);
      if (data.jobId === currentJobId) {
        setJobStatus(prev => {
          if (!prev) return null;
          const newStages = [...(prev.stages || [])];
          const stageIndex = newStages.findIndex(s => s.name === data.stage);
          if (stageIndex !== -1) {
            newStages[stageIndex] = {
              ...newStages[stageIndex],
              status: data.status,
              progress: data.progress
            };
          }
          return {
            ...prev,
            stages: newStages
          };
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentJobId]);

  // Subscribe to job updates when job ID changes
  useEffect(() => {
    if (currentJobId && socketRef.current) {
      console.log('Subscribing to job:', currentJobId);
      socketRef.current.emit('subscribe', currentJobId);

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('unsubscribe', currentJobId);
        }
      };
    }
  }, [currentJobId]);

  // Handle API key setup
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!apiKeys.gemini && !apiKeys.claude) {
      setError('Please provide at least one API key');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/setup`, {
        geminiApiKey: apiKeys.gemini,
        claudeApiKey: apiKeys.claude
      });

      if (response.data.success) {
        setIsConfigured(true);
        setShowApiSetup(false);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to configure API keys');
    }
  };

  // Handle admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: adminCredentials.username,
        password: adminCredentials.password
      });

      if (response.data.success) {
        setAuthToken(response.data.token);
        setIsAdmin(response.data.user.isAdmin);
        setShowAdminLogin(false);
        setAdminCredentials({ username: '', password: '' });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  // Handle admin logout
  const handleAdminLogout = () => {
    setAuthToken(null);
    setIsAdmin(false);
    setShowAdminLogin(false);
  };

  // Handle game selection
  const handleGameSelect = (game) => {
    setSelectedGame(game);
  };

  // Handle game generation
  const handleGenerateGame = async () => {
    if (!selectedGame) {
      setError('Please select a game type first');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setJobStatus(null);

    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const response = await axios.post(`${API_BASE_URL}/generate-game`, {
        gameType: selectedGame.type,
        gameName: selectedGame.name,
        requirements: selectedGame.requirements || {}
      }, { headers });

      if (response.data.success) {
        setCurrentJobId(response.data.jobId);

        // Initialize job status
        setJobStatus({
          id: response.data.jobId,
          status: 'queued',
          progress: 0,
          stages: [
            { name: 'initialization', status: 'pending', progress: 0 },
            { name: 'concept', status: 'pending', progress: 0 },
            { name: 'mechanics', status: 'pending', progress: 0 },
            { name: 'assets', status: 'pending', progress: 0 },
            { name: 'code-generation', status: 'pending', progress: 0 },
            { name: 'integration', status: 'pending', progress: 0 }
          ]
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game generation');
      setIsGenerating(false);
    }
  };

  // Download generated game as ZIP
  const handleDownloadZip = () => {
    if (!currentJobId) return;

    const downloadUrl = `${API_BASE_URL.replace('/api', '')}/api/download/${currentJobId}`;
    window.open(downloadUrl, '_blank');
  };

  // Download individual files (legacy support)
  const handleDownloadFiles = () => {
    if (!jobStatus?.result?.files) return;

    const files = jobStatus.result.files;

    // Create a simple download for each file
    Object.entries(files).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Reset generation
  const handleReset = () => {
    setCurrentJobId(null);
    setJobStatus(null);
    setIsGenerating(false);
    setSelectedGame(null);
    setError(null);
  };

  // If admin is logged in, show admin dashboard
  if (isAdmin && authToken) {
    return <AdminDashboard token={authToken} onLogout={handleAdminLogout} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 GAMECHAMBER v2.0</h1>
        <p className="tagline">AI-Powered Game Generation Platform</p>
        {!isAdmin && (
          <button
            className="admin-link"
            onClick={() => setShowAdminLogin(!showAdminLogin)}
          >
            {showAdminLogin ? 'Hide Admin Login' : 'Admin Login'}
          </button>
        )}
      </header>

      <main className="app-main">
        {/* Admin Login Section */}
        {showAdminLogin && !isAdmin && (
          <section className="admin-login-section">
            <div className="login-card">
              <h2>🔐 Admin Login</h2>
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label htmlFor="admin-username">Username</label>
                  <input
                    id="admin-username"
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials({
                      ...adminCredentials,
                      username: e.target.value
                    })}
                    placeholder="Enter admin username"
                    className="api-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({
                      ...adminCredentials,
                      password: e.target.value
                    })}
                    placeholder="Enter admin password"
                    className="api-input"
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="btn btn-primary btn-large">
                  Login
                </button>
              </form>
            </div>
          </section>
        )}

        {/* API Key Setup Section */}
        {showApiSetup && !showAdminLogin && (
          <section className="api-setup-section">
            <div className="setup-card">
              <h2>🔑 API Configuration</h2>
              <p className="setup-description">
                Enter your API key(s) to get started. You can use Gemini, Claude, or both.
                <br />
                <small>Don't have keys? The system will use cached templates as fallback.</small>
              </p>

              <form onSubmit={handleSetupSubmit}>
                <div className="form-group">
                  <label htmlFor="gemini-key">
                    <strong>Gemini API Key</strong>
                    <span className="optional">(Primary)</span>
                  </label>
                  <input
                    id="gemini-key"
                    type="password"
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                    placeholder="Enter your Gemini API key (optional)"
                    className="api-input"
                  />
                  <small>Get your key at: https://makersuite.google.com/app/apikey</small>
                </div>

                <div className="form-group">
                  <label htmlFor="claude-key">
                    <strong>Claude API Key</strong>
                    <span className="optional">(Fallback)</span>
                  </label>
                  <input
                    id="claude-key"
                    type="password"
                    value={apiKeys.claude}
                    onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                    placeholder="Enter your Claude API key (optional)"
                    className="api-input"
                  />
                  <small>Get your key at: https://console.anthropic.com/</small>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn btn-primary btn-large">
                  Configure & Continue
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-large"
                  onClick={() => {
                    setIsConfigured(true);
                    setShowApiSetup(false);
                  }}
                >
                  Skip (Use Templates)
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Main Application */}
        {isConfigured && !showApiSetup && !showAdminLogin && (
          <>
            <div className="status-bar">
              <span className="status-indicator">
                ✅ System Ready
              </span>
              <span className="ws-indicator">
                🔌 Real-time Updates Active
              </span>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowApiSetup(true)}
              >
                Change API Keys
              </button>
            </div>

            {!isGenerating && !jobStatus ? (
              <>
                <GameCatalogue
                  onSelectGame={handleGameSelect}
                  selectedGame={selectedGame}
                />

                {selectedGame && (
                  <div className="action-section">
                    <div className="selected-game-info">
                      <h3>Selected: {selectedGame.name}</h3>
                      <p>{selectedGame.description}</p>
                    </div>
                    <button
                      className="btn btn-primary btn-large btn-generate"
                      onClick={handleGenerateGame}
                    >
                      🚀 Generate Game
                    </button>
                  </div>
                )}
              </>
            ) : (
              <ProgressDashboard
                jobStatus={jobStatus}
                isGenerating={isGenerating}
                onDownloadZip={handleDownloadZip}
                onDownloadFiles={handleDownloadFiles}
                onReset={handleReset}
              />
            )}

            {error && (
              <div className="error-message-main">
                {error}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Powered by Gemini & Claude AI | GAMECHAMBER v2.0
          <br />
          <small>
            Features: WebSocket Updates • Queue System • JWT Auth • ZIP Export • Batch Generation
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
