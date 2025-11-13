import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GameCatalogue from './GameCatalogue';
import ProgressDashboard from './ProgressDashboard';
import './App.css';

const API_BASE_URL = 'http://localhost:3001/api';

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

  // Poll for job status updates
  useEffect(() => {
    if (!currentJobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/status/${currentJobId}`);
        if (response.data.success) {
          setJobStatus(response.data.job);

          // Stop polling if job is completed or failed
          if (response.data.job.status === 'completed' || response.data.job.status === 'failed') {
            setIsGenerating(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error fetching job status:', err);
      }
    }, 1000); // Poll every second

    return () => clearInterval(interval);
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
      const response = await axios.post(`${API_BASE_URL}/generate-game`, {
        gameType: selectedGame.type,
        gameName: selectedGame.name,
        requirements: selectedGame.requirements || {}
      });

      if (response.data.success) {
        setCurrentJobId(response.data.jobId);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start game generation');
      setIsGenerating(false);
    }
  };

  // Download generated game
  const handleDownloadGame = () => {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 GAMECHAMBER</h1>
        <p className="tagline">AI-Powered Game Generation Platform</p>
      </header>

      <main className="app-main">
        {/* API Key Setup Section */}
        {showApiSetup && (
          <section className="api-setup-section">
            <div className="setup-card">
              <h2>🔑 API Configuration</h2>
              <p className="setup-description">
                Enter your API key(s) to get started. You can use Gemini, Claude, or both.
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
                    placeholder="Enter your Gemini API key"
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
                    placeholder="Enter your Claude API key"
                    className="api-input"
                  />
                  <small>Get your key at: https://console.anthropic.com/</small>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn btn-primary btn-large">
                  Configure & Continue
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Main Application */}
        {isConfigured && !showApiSetup && (
          <>
            <div className="status-bar">
              <span className="status-indicator">
                ✅ API Configured
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
                onDownload={handleDownloadGame}
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
        <p>Powered by Gemini & Claude AI | GAMECHAMBER v1.0</p>
      </footer>
    </div>
  );
}

export default App;
