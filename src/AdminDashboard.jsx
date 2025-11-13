import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

function AdminDashboard({ token, onLogout }) {
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication failed');
        onLogout();
      }
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/jobs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchJobs()]);
      setLoading(false);
    };

    loadData();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchJobs();
    }, 5000);

    setRefreshInterval(interval);

    return () => clearInterval(interval);
  }, [token]);

  // Pause queue
  const handlePauseQueue = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/queue/pause`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStats();
    } catch (err) {
      alert('Failed to pause queue: ' + err.message);
    }
  };

  // Resume queue
  const handleResumeQueue = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/queue/resume`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStats();
    } catch (err) {
      alert('Failed to resume queue: ' + err.message);
    }
  };

  // Update concurrency
  const handleUpdateConcurrency = async () => {
    const newValue = prompt('Enter new max concurrent jobs (1-10):', stats?.queue?.maxConcurrent || 3);
    if (newValue && !isNaN(newValue)) {
      try {
        await axios.put(`${API_BASE_URL}/admin/queue/concurrency`,
          { maxConcurrent: parseInt(newValue) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchStats();
      } catch (err) {
        alert('Failed to update concurrency: ' + err.message);
      }
    }
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onLogout} className="btn btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={onLogout} className="btn btn-secondary">
          Logout
        </button>
      </header>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'queue' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('queue')}
        >
          Queue Management
        </button>
        <button
          className={activeTab === 'jobs' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('jobs')}
        >
          All Jobs
        </button>
        <button
          className={activeTab === 'system' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('system')}
        >
          System Info
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && stats && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Jobs</h3>
                <p className="stat-value">{stats.jobs.total}</p>
              </div>
              <div className="stat-card success">
                <h3>Completed</h3>
                <p className="stat-value">{stats.jobs.completed}</p>
              </div>
              <div className="stat-card warning">
                <h3>In Progress</h3>
                <p className="stat-value">{stats.jobs.inProgress}</p>
              </div>
              <div className="stat-card error">
                <h3>Failed</h3>
                <p className="stat-value">{stats.jobs.failed}</p>
              </div>
            </div>

            <div className="queue-status">
              <h2>Queue Status</h2>
              <div className="queue-info">
                <p><strong>Pending:</strong> {stats.queue.queue.pending}</p>
                <p><strong>Active:</strong> {stats.queue.queue.active} / {stats.queue.queue.maxConcurrent}</p>
                <p><strong>Avg Processing Time:</strong> {Math.round(stats.queue.stats.averageProcessingTime / 1000)}s</p>
              </div>

              {stats.queue.activeJobs.length > 0 && (
                <div className="active-jobs">
                  <h3>Currently Processing:</h3>
                  {stats.queue.activeJobs.map(job => (
                    <div key={job.id} className="active-job-item">
                      <span className="job-id">{job.id.substring(0, 8)}</span>
                      <span className="job-type">{job.data.gameType}</span>
                      <span className="job-time">
                        {Math.round((Date.now() - job.startedAt) / 1000)}s
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'queue' && stats && (
          <div className="queue-tab">
            <div className="queue-controls">
              <button onClick={handlePauseQueue} className="btn btn-warning">
                Pause Queue
              </button>
              <button onClick={handleResumeQueue} className="btn btn-success">
                Resume Queue
              </button>
              <button onClick={handleUpdateConcurrency} className="btn btn-primary">
                Set Concurrency
              </button>
            </div>

            <div className="queue-details">
              <h2>Queue Configuration</h2>
              <p><strong>Max Concurrent Jobs:</strong> {stats.queue.queue.maxConcurrent}</p>
              <p><strong>Currently Active:</strong> {stats.queue.queue.active}</p>
              <p><strong>Pending in Queue:</strong> {stats.queue.queue.pending}</p>
            </div>

            {stats.queue.queuedJobs.length > 0 && (
              <div className="queued-jobs">
                <h3>Queued Jobs ({stats.queue.queuedJobs.length})</h3>
                <table className="jobs-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Queued At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.queue.queuedJobs.map(job => (
                      <tr key={job.id}>
                        <td>{job.id.substring(0, 8)}</td>
                        <td>{job.data.gameType}</td>
                        <td>{job.priority}</td>
                        <td>{new Date(job.queuedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            <h2>All Jobs ({jobs.length})</h2>
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>User</th>
                  <th>Progress</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td className="job-id">{job.id.substring(0, 8)}</td>
                    <td>{job.gameType}</td>
                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>{job.user || 'anonymous'}</td>
                    <td>{job.progress}%</td>
                    <td>{new Date(job.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'system' && stats && (
          <div className="system-tab">
            <div className="system-section">
              <h2>System Information</h2>
              <p><strong>Uptime:</strong> {formatUptime(stats.system.uptime)}</p>
              <p><strong>Node Version:</strong> {stats.system.nodeVersion}</p>
            </div>

            <div className="system-section">
              <h2>Memory Usage</h2>
              <p><strong>RSS:</strong> {formatBytes(stats.system.memory.rss)}</p>
              <p><strong>Heap Used:</strong> {formatBytes(stats.system.memory.heapUsed)}</p>
              <p><strong>Heap Total:</strong> {formatBytes(stats.system.memory.heapTotal)}</p>
              <p><strong>External:</strong> {formatBytes(stats.system.memory.external)}</p>
            </div>

            <div className="system-section">
              <h2>Configuration</h2>
              <p><strong>Max Concurrent Jobs:</strong> {stats.config.maxConcurrentJobs}</p>
              <p><strong>Job Timeout:</strong> {stats.config.jobTimeout / 1000}s</p>
              <p><strong>Gemini API:</strong> {stats.config.geminiConfigured ? '✓ Configured' : '✗ Not configured'}</p>
              <p><strong>Claude API:</strong> {stats.config.claudeConfigured ? '✓ Configured' : '✗ Not configured'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
