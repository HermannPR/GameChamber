import React from 'react';
import './ProgressDashboard.css';

function ProgressDashboard({ jobStatus, isGenerating, onDownload, onReset }) {
  if (!jobStatus && isGenerating) {
    return (
      <div className="progress-dashboard">
        <div className="loading-initial">
          <div className="spinner"></div>
          <h3>Initializing game generation...</h3>
          <p>Please wait while we prepare your game</p>
        </div>
      </div>
    );
  }

  if (!jobStatus) return null;

  const getStageIcon = (stageName) => {
    const icons = {
      'initialization': '⚙️',
      'concept': '💡',
      'mechanics': '🎮',
      'assets': '🎨',
      'code-generation': '💻',
      'integration': '🔧'
    };
    return icons[stageName] || '📦';
  };

  const getStageLabel = (stageName) => {
    const labels = {
      'initialization': 'Initialization',
      'concept': 'Concept Design',
      'mechanics': 'Game Mechanics',
      'assets': 'Asset Generation',
      'code-generation': 'Code Generation',
      'integration': 'Integration'
    };
    return labels[stageName] || stageName;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#2196F3';
      case 'failed':
        return '#f44336';
      default:
        return '#ccc';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in-progress':
        return '⟳';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  const isCompleted = jobStatus.status === 'completed';
  const isFailed = jobStatus.status === 'failed';

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h2>
          {isCompleted ? '✓ Game Generation Complete!' :
           isFailed ? '✗ Generation Failed' :
           '⚡ Generating Your Game...'}
        </h2>
        <p className="game-name">
          {jobStatus.gameName} ({jobStatus.gameType})
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="overall-progress">
        <div className="progress-info">
          <span>Overall Progress</span>
          <span className="progress-percentage">{jobStatus.progress}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${jobStatus.progress}%`,
              backgroundColor: isFailed ? '#f44336' : isCompleted ? '#4caf50' : '#2196F3'
            }}
          />
        </div>
      </div>

      {/* Stage Progress */}
      <div className="stages-container">
        <h3>Generation Stages</h3>
        <div className="stages-list">
          {jobStatus.stages.map((stage, index) => (
            <div
              key={stage.name}
              className={`stage-item ${stage.status}`}
            >
              <div className="stage-header">
                <div className="stage-left">
                  <span className="stage-number">{index + 1}</span>
                  <span className="stage-icon">{getStageIcon(stage.name)}</span>
                  <span className="stage-name">{getStageLabel(stage.name)}</span>
                </div>
                <div className="stage-right">
                  <span
                    className="stage-status-icon"
                    style={{ color: getStatusColor(stage.status) }}
                  >
                    {getStatusIcon(stage.status)}
                  </span>
                  <span className="stage-status-text">
                    {stage.status === 'in-progress' ? 'Processing...' :
                     stage.status === 'completed' ? 'Complete' :
                     stage.status === 'failed' ? 'Failed' :
                     'Pending'}
                  </span>
                </div>
              </div>

              {stage.status === 'in-progress' && (
                <div className="stage-progress-bar">
                  <div className="stage-progress-fill animating" />
                </div>
              )}

              {stage.status === 'completed' && stage.data && (
                <div className="stage-details">
                  <button
                    className="view-details-btn"
                    onClick={() => {
                      const el = document.getElementById(`stage-data-${index}`);
                      if (el) {
                        el.style.display = el.style.display === 'none' ? 'block' : 'none';
                      }
                    }}
                  >
                    View Details
                  </button>
                  <pre id={`stage-data-${index}`} className="stage-data" style={{ display: 'none' }}>
                    {JSON.stringify(stage.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {isFailed && jobStatus.error && (
        <div className="error-container">
          <h3>❌ Error Details</h3>
          <p className="error-text">{jobStatus.error}</p>
        </div>
      )}

      {/* Generation Stats */}
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Started:</span>
          <span className="stat-value">
            {new Date(jobStatus.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Updated:</span>
          <span className="stat-value">
            {new Date(jobStatus.updatedAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Job ID:</span>
          <span className="stat-value code">{jobStatus.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {isCompleted && (
          <button
            className="btn btn-success btn-large"
            onClick={onDownload}
          >
            📥 Download Game Files
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={onReset}
        >
          {isCompleted || isFailed ? '← Generate Another Game' : '✕ Cancel'}
        </button>
      </div>

      {/* Real-time Updates Indicator */}
      {!isCompleted && !isFailed && (
        <div className="realtime-indicator">
          <span className="pulse-dot"></span>
          <span>Live updates enabled</span>
        </div>
      )}
    </div>
  );
}

export default ProgressDashboard;
