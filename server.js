import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { GameGenerator } from './gameGenerator.js';
import { getConfig, displayConfigSummary } from './config/envValidator.js';
import { authenticateToken, optionalAuth, requireAdmin, rateLimiter } from './middleware/auth.js';
import { login, verifyToken, refreshToken, getCurrentUser, initializeDefaultAdmin } from './controllers/authController.js';
import { JobQueue } from './services/jobQueue.js';
import { streamGameZip, validateGameData } from './services/zipExporter.js';
import { GameLibrary } from './services/gameLibrary.js';

// Validate and get configuration
const config = getConfig();
displayConfigSummary(config);

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.WS_CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api/', rateLimiter(
  config.RATE_LIMIT_WINDOW_MS,
  config.RATE_LIMIT_MAX_REQUESTS
));

// In-memory store for game generation jobs
const jobs = new Map();

// Initialize job queue
const jobQueue = new JobQueue({
  maxConcurrent: config.MAX_CONCURRENT_JOBS,
  timeout: config.JOB_TIMEOUT
});

// Initialize game library
const gameLibrary = new GameLibrary();
gameLibrary.initialize().catch(err => {
  console.error('Failed to initialize game library:', err);
});

// Initialize admin user
initializeDefaultAdmin();

console.log('🚀 Initializing GAMECHAMBER server...\n');

// ============================================
// WebSocket Connection Handler
// ============================================
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join a job room to receive updates
  socket.on('subscribe', (jobId) => {
    socket.join(`job-${jobId}`);
    console.log(`📡 Client ${socket.id} subscribed to job ${jobId}`);
  });

  // Unsubscribe from job updates
  socket.on('unsubscribe', (jobId) => {
    socket.leave(`job-${jobId}`);
    console.log(`📡 Client ${socket.id} unsubscribed from job ${jobId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ============================================
// Job Queue Event Handlers
// ============================================
jobQueue.on('jobQueued', (job) => {
  console.log(`📥 Job queued: ${job.id}`);
  io.to(`job-${job.id}`).emit('jobUpdate', {
    jobId: job.id,
    status: 'queued',
    queuePosition: jobQueue.queue.findIndex(j => j.id === job.id) + 1
  });
});

jobQueue.on('jobStarted', (job) => {
  console.log(`▶️  Job started: ${job.id}`);
  io.to(`job-${job.id}`).emit('jobUpdate', {
    jobId: job.id,
    status: 'processing',
    message: 'Game generation started'
  });
});

jobQueue.on('jobCompleted', (job) => {
  console.log(`✅ Job completed: ${job.id}`);
  io.to(`job-${job.id}`).emit('jobUpdate', {
    jobId: job.id,
    status: 'completed',
    message: 'Game generation completed',
    result: job.result
  });
});

jobQueue.on('jobFailed', (job, error) => {
  console.log(`❌ Job failed: ${job.id} - ${error.message}`);
  io.to(`job-${job.id}`).emit('jobUpdate', {
    jobId: job.id,
    status: 'failed',
    error: error.message
  });
});

// Process jobs from queue
jobQueue.on('processJob', async (job) => {
  try {
    await generateGameAsync(job.id, job.data);
  } catch (error) {
    jobQueue.failJob(job.id, error);
  }
});

// ============================================
// Authentication Routes
// ============================================
app.post('/api/auth/login', login);
app.post('/api/auth/verify', authenticateToken, verifyToken);
app.post('/api/auth/refresh', authenticateToken, refreshToken);
app.get('/api/auth/me', authenticateToken, getCurrentUser);

// ============================================
// Game Generation Routes
// ============================================

/**
 * POST /api/setup
 * Initialize API configuration with user-provided keys
 */
app.post('/api/setup', async (req, res) => {
  try {
    const { geminiApiKey, claudeApiKey } = req.body;

    if (!geminiApiKey && !claudeApiKey) {
      return res.status(400).json({
        error: 'At least one API key (Gemini or Claude) is required'
      });
    }

    // Validate API keys format (basic validation)
    if (geminiApiKey && typeof geminiApiKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid Gemini API key format'
      });
    }

    if (claudeApiKey && typeof claudeApiKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid Claude API key format'
      });
    }

    // Store keys in memory (in production, use secure storage)
    process.env.GEMINI_API_KEY = geminiApiKey || process.env.GEMINI_API_KEY;
    process.env.CLAUDE_API_KEY = claudeApiKey || process.env.CLAUDE_API_KEY;

    res.json({
      success: true,
      message: 'API keys configured successfully',
      configured: {
        gemini: !!geminiApiKey,
        claude: !!claudeApiKey
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      error: 'Failed to configure API keys',
      details: error.message
    });
  }
});

/**
 * POST /api/generate-game
 * Start a new game generation job
 */
app.post('/api/generate-game', optionalAuth, async (req, res) => {
  try {
    const { gameType, gameName, requirements, priority } = req.body;

    // Validation
    if (!gameType) {
      return res.status(400).json({
        error: 'Game type is required'
      });
    }

    if (!['platformer', 'rpg', 'puzzle'].includes(gameType)) {
      return res.status(400).json({
        error: 'Invalid game type. Must be: platformer, rpg, or puzzle'
      });
    }

    // Check if API keys are configured
    if (!process.env.GEMINI_API_KEY && !process.env.CLAUDE_API_KEY) {
      return res.status(400).json({
        error: 'API keys not configured. Please call /api/setup first'
      });
    }

    // Create job ID
    const jobId = uuidv4();

    // Initialize job status
    const jobData = {
      id: jobId,
      gameType,
      gameName: gameName || `${gameType}-game`,
      requirements: requirements || {},
      status: 'pending',
      progress: 0,
      stages: [
        { name: 'initialization', status: 'pending', progress: 0 },
        { name: 'concept', status: 'pending', progress: 0 },
        { name: 'mechanics', status: 'pending', progress: 0 },
        { name: 'assets', status: 'pending', progress: 0 },
        { name: 'code-generation', status: 'pending', progress: 0 },
        { name: 'integration', status: 'pending', progress: 0 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      error: null,
      user: req.user?.username || 'anonymous'
    };

    jobs.set(jobId, jobData);

    // Add to queue with priority
    const jobPriority = priority || (req.user?.isAdmin ? 10 : 0);
    jobQueue.addJob(jobId, jobData, jobPriority);

    res.json({
      success: true,
      jobId,
      message: 'Game generation queued',
      status: jobData.status,
      queuePosition: jobQueue.queue.findIndex(j => j.id === jobId) + 1
    });
  } catch (error) {
    console.error('Generate game error:', error);
    res.status(500).json({
      error: 'Failed to start game generation',
      details: error.message
    });
  }
});

/**
 * POST /api/generate-batch
 * Generate multiple games in batch
 */
app.post('/api/generate-batch', authenticateToken, async (req, res) => {
  try {
    const { games } = req.body;

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({
        error: 'Games array is required and must not be empty'
      });
    }

    if (games.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 games per batch'
      });
    }

    const jobIds = [];

    for (const game of games) {
      const jobId = uuidv4();
      const jobData = {
        id: jobId,
        gameType: game.gameType,
        gameName: game.gameName || `${game.gameType}-game`,
        requirements: game.requirements || {},
        status: 'pending',
        progress: 0,
        stages: [
          { name: 'initialization', status: 'pending', progress: 0 },
          { name: 'concept', status: 'pending', progress: 0 },
          { name: 'mechanics', status: 'pending', progress: 0 },
          { name: 'assets', status: 'pending', progress: 0 },
          { name: 'code-generation', status: 'pending', progress: 0 },
          { name: 'integration', status: 'pending', progress: 0 }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        result: null,
        error: null,
        user: req.user.username,
        batch: true
      };

      jobs.set(jobId, jobData);
      jobQueue.addJob(jobId, jobData, game.priority || 5);
      jobIds.push(jobId);
    }

    res.json({
      success: true,
      message: `${jobIds.length} games queued for generation`,
      jobIds,
      queueStatus: jobQueue.getStatus()
    });
  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({
      error: 'Failed to start batch generation',
      details: error.message
    });
  }
});

/**
 * GET /api/status/:jobId
 * Get the status of a game generation job
 */
app.get('/api/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobs.has(jobId)) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const jobData = jobs.get(jobId);
    const queueJob = jobQueue.getJob(jobId);

    res.json({
      success: true,
      job: {
        ...jobData,
        queueStatus: queueJob?.status,
        queuePosition: jobQueue.queue.findIndex(j => j.id === jobId) + 1
      }
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to retrieve job status',
      details: error.message
    });
  }
});

/**
 * GET /api/download/:jobId
 * Download game as ZIP file
 */
app.get('/api/download/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobs.has(jobId)) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const jobData = jobs.get(jobId);

    if (jobData.status !== 'completed') {
      return res.status(400).json({
        error: 'Game generation not completed yet'
      });
    }

    if (!validateGameData(jobData.result)) {
      return res.status(500).json({
        error: 'Invalid game data - cannot create ZIP'
      });
    }

    const filename = `${jobData.gameName || 'game'}-${jobId.substring(0, 8)}.zip`;
    await streamGameZip(jobData.result, res, filename);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Failed to download game',
      details: error.message
    });
  }
});

/**
 * DELETE /api/jobs/:jobId
 * Cancel a job
 */
app.delete('/api/jobs/:jobId', authenticateToken, (req, res) => {
  try {
    const { jobId } = req.params;

    const cancelled = jobQueue.cancelJob(jobId);

    if (!cancelled) {
      return res.status(404).json({
        error: 'Job not found or already completed'
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      error: 'Failed to cancel job',
      details: error.message
    });
  }
});

// ============================================
// Game Library Routes
// ============================================

/**
 * POST /api/library/games
 * Save a completed game to the library
 */
app.post('/api/library/games', optionalAuth, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required'
      });
    }

    // Get job data
    if (!jobs.has(jobId)) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    const jobData = jobs.get(jobId);

    if (jobData.status !== 'completed') {
      return res.status(400).json({
        error: 'Job not completed yet'
      });
    }

    // Add to library
    const userId = req.user?.username || 'anonymous';
    const libraryEntry = await gameLibrary.addGame({
      ...jobData.result,
      jobId,
      gameName: jobData.gameName,
      gameType: jobData.gameType
    }, userId);

    res.json({
      success: true,
      game: libraryEntry,
      message: 'Game added to library'
    });
  } catch (error) {
    console.error('Save to library error:', error);
    res.status(500).json({
      error: 'Failed to save game to library',
      details: error.message
    });
  }
});

/**
 * GET /api/library/games
 * List games in library
 */
app.get('/api/library/games', optionalAuth, async (req, res) => {
  try {
    const {
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = req.query;

    const userId = req.user?.username || null;

    const result = await gameLibrary.listGames({
      userId,
      type,
      search,
      sortBy,
      sortOrder,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('List library error:', error);
    res.status(500).json({
      error: 'Failed to list games',
      details: error.message
    });
  }
});

/**
 * GET /api/library/games/:id
 * Get specific game metadata
 */
app.get('/api/library/games/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const game = await gameLibrary.getGame(id);

    res.json({
      success: true,
      game
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(404).json({
      error: 'Game not found',
      details: error.message
    });
  }
});

/**
 * GET /api/library/games/:id/play
 * Get game HTML for playing
 */
app.get('/api/library/games/:id/play', async (req, res) => {
  try {
    const { id } = req.params;

    const html = await gameLibrary.getGameHTML(id);

    // Set security headers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "frame-ancestors 'self'"
    );

    res.send(html);
  } catch (error) {
    console.error('Play game error:', error);
    res.status(404).json({
      error: 'Game not found',
      details: error.message
    });
  }
});

/**
 * PUT /api/library/games/:id
 * Update game metadata
 */
app.put('/api/library/games/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const game = await gameLibrary.updateGame(id, updates);

    res.json({
      success: true,
      game,
      message: 'Game updated successfully'
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      error: 'Failed to update game',
      details: error.message
    });
  }
});

/**
 * DELETE /api/library/games/:id
 * Delete game from library
 */
app.delete('/api/library/games/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await gameLibrary.deleteGame(id);

    res.json({
      success: true,
      message: 'Game deleted from library'
    });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      error: 'Failed to delete game',
      details: error.message
    });
  }
});

/**
 * GET /api/library/stats
 * Get library statistics
 */
app.get('/api/library/stats', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.username || null;

    const stats = await gameLibrary.getStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Library stats error:', error);
    res.status(500).json({
      error: 'Failed to get library stats',
      details: error.message
    });
  }
});

/**
 * POST /api/library/games/:id/download
 * Track download and return ZIP
 */
app.post('/api/library/games/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const game = await gameLibrary.getGame(id);
    await gameLibrary.incrementDownloads(id);

    // Get the game HTML
    const html = await gameLibrary.getGameHTML(id);

    // Create a simple ZIP with the game
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${game.title.replace(/[^a-z0-9]/gi, '_')}.zip"`);

    // For now, just send the HTML file
    // TODO: Create proper ZIP with assets
    res.send(html);
  } catch (error) {
    console.error('Download library game error:', error);
    res.status(500).json({
      error: 'Failed to download game',
      details: error.message
    });
  }
});

// ============================================
// Admin Routes
// ============================================

/**
 * GET /api/admin/stats
 * Get system statistics
 */
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const allJobs = Array.from(jobs.values());

    const stats = {
      queue: jobQueue.getStatus(),
      jobs: {
        total: allJobs.length,
        completed: allJobs.filter(j => j.status === 'completed').length,
        failed: allJobs.filter(j => j.status === 'failed').length,
        inProgress: allJobs.filter(j => j.status === 'in-progress').length,
        pending: allJobs.filter(j => j.status === 'pending').length
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      config: {
        maxConcurrentJobs: config.MAX_CONCURRENT_JOBS,
        jobTimeout: config.JOB_TIMEOUT,
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        claudeConfigured: !!process.env.CLAUDE_API_KEY
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve stats',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/jobs
 * Get all jobs (paginated)
 */
app.get('/api/admin/jobs', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let allJobs = Array.from(jobs.values());

    // Filter by status if provided
    if (status) {
      allJobs = allJobs.filter(j => j.status === status);
    }

    // Sort by creation date (newest first)
    allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginate
    const paginatedJobs = allJobs.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      jobs: paginatedJobs,
      total: allJobs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/queue/pause
 * Pause queue processing
 */
app.post('/api/admin/queue/pause', authenticateToken, requireAdmin, (req, res) => {
  try {
    jobQueue.pause();
    res.json({
      success: true,
      message: 'Queue paused'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to pause queue',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/queue/resume
 * Resume queue processing
 */
app.post('/api/admin/queue/resume', authenticateToken, requireAdmin, (req, res) => {
  try {
    jobQueue.resume();
    res.json({
      success: true,
      message: 'Queue resumed'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to resume queue',
      details: error.message
    });
  }
});

/**
 * PUT /api/admin/queue/concurrency
 * Update max concurrent jobs
 */
app.put('/api/admin/queue/concurrency', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { maxConcurrent } = req.body;

    if (!maxConcurrent || maxConcurrent < 1 || maxConcurrent > 10) {
      return res.status(400).json({
        error: 'maxConcurrent must be between 1 and 10'
      });
    }

    jobQueue.setMaxConcurrent(maxConcurrent);

    res.json({
      success: true,
      message: `Max concurrent jobs set to ${maxConcurrent}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update concurrency',
      details: error.message
    });
  }
});

// ============================================
// Async Game Generation Function
// ============================================
async function generateGameAsync(jobId, jobData) {
  const updateJob = (updates) => {
    const job = jobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date().toISOString() });
      jobs.set(jobId, job);

      // Emit WebSocket update
      io.to(`job-${jobId}`).emit('jobUpdate', {
        jobId,
        ...updates
      });
    }
  };

  const updateStage = (stageName, stageUpdates) => {
    const job = jobs.get(jobId);
    if (job) {
      const stageIndex = job.stages.findIndex(s => s.name === stageName);
      if (stageIndex !== -1) {
        Object.assign(job.stages[stageIndex], stageUpdates);
        jobs.set(jobId, job);

        // Emit WebSocket update
        io.to(`job-${jobId}`).emit('stageUpdate', {
          jobId,
          stage: stageName,
          ...stageUpdates
        });
      }
    }
  };

  try {
    updateJob({ status: 'in-progress' });

    const generator = new GameGenerator({
      geminiApiKey: process.env.GEMINI_API_KEY,
      claudeApiKey: process.env.CLAUDE_API_KEY
    });

    // Stage 1: Initialization
    updateStage('initialization', { status: 'in-progress', progress: 0 });
    await new Promise(resolve => setTimeout(resolve, 500));
    updateStage('initialization', { status: 'completed', progress: 100 });
    updateJob({ progress: 15 });

    // Stage 2: Concept Generation
    updateStage('concept', { status: 'in-progress', progress: 0 });
    const concept = await generator.generateConcept(jobData.gameType, jobData.gameName, jobData.requirements);
    updateStage('concept', {
      status: 'completed',
      progress: 100,
      data: concept
    });
    updateJob({ progress: 30 });

    // Stage 3: Game Mechanics
    updateStage('mechanics', { status: 'in-progress', progress: 0 });
    const mechanics = await generator.generateMechanics(jobData.gameType, concept);
    updateStage('mechanics', {
      status: 'completed',
      progress: 100,
      data: mechanics
    });
    updateJob({ progress: 50 });

    // Stage 4: Asset Generation
    updateStage('assets', { status: 'in-progress', progress: 0 });
    const assets = await generator.generateAssets(jobData.gameType, concept);
    updateStage('assets', {
      status: 'completed',
      progress: 100,
      data: assets
    });
    updateJob({ progress: 70 });

    // Stage 5: Code Generation
    updateStage('code-generation', { status: 'in-progress', progress: 0 });
    const code = await generator.generateCode(jobData.gameType, mechanics, assets);
    updateStage('code-generation', {
      status: 'completed',
      progress: 100,
      data: code
    });
    updateJob({ progress: 85 });

    // Stage 6: Integration
    updateStage('integration', { status: 'in-progress', progress: 0 });
    const finalGame = await generator.integrateGame(concept, mechanics, assets, code);

    // Add API used info
    finalGame.apiUsed = generator.apiUsed;
    finalGame.usedFallback = generator.usedFallback;

    updateStage('integration', {
      status: 'completed',
      progress: 100,
      data: finalGame
    });

    // Complete the job
    updateJob({
      status: 'completed',
      progress: 100,
      result: finalGame
    });

    // Mark as completed in queue
    jobQueue.completeJob(jobId, finalGame);

    console.log(`✅ Job ${jobId} completed successfully (API: ${generator.apiUsed})`);
  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    updateJob({
      status: 'failed',
      error: error.message
    });

    // Mark as failed in queue
    jobQueue.failJob(jobId, error);
  }
}

// ============================================
// Health Check & Info
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    queue: jobQueue.getStatus()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'GAMECHAMBER',
    version: '2.0.0',
    description: 'AI-Powered Game Generation Platform',
    features: [
      'Real-time WebSocket updates',
      'Job queue with concurrency control',
      'JWT authentication',
      'ZIP export',
      'Batch generation',
      'Admin dashboard',
      'Fallback chain: Gemini -> Claude -> Templates'
    ],
    apis: {
      gemini: !!process.env.GEMINI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY
    }
  });
});

// ============================================
// Start Server
// ============================================
httpServer.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎮 GAMECHAMBER Server v2.0 - Running on port ${PORT}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 HTTP API: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`📊 Info: http://localhost:${PORT}/api/info`);
  console.log(`${'='.repeat(60)}\n`);
  console.log('🚀 Server ready to accept connections!\n');
});

// Cleanup old jobs periodically (every hour)
setInterval(() => {
  const cleared = jobQueue.clearOldJobs(3600000); // 1 hour
  if (cleared > 0) {
    console.log(`🧹 Cleaned up ${cleared} old jobs`);
  }
}, 3600000);

export default app;
