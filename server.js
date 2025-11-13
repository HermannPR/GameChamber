import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { GameGenerator } from './gameGenerator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory store for game generation jobs
const jobs = new Map();

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
app.post('/api/generate-game', async (req, res) => {
  try {
    const { gameType, gameName, requirements } = req.body;

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
      error: null
    };

    jobs.set(jobId, jobData);

    // Start game generation asynchronously
    generateGameAsync(jobId, gameType, gameName, requirements);

    res.json({
      success: true,
      jobId,
      message: 'Game generation started',
      status: jobData.status
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
    res.json({
      success: true,
      job: jobData
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
 * GET /api/status
 * Get all jobs (for debugging)
 */
app.get('/api/status', (req, res) => {
  try {
    const allJobs = Array.from(jobs.values());
    res.json({
      success: true,
      jobs: allJobs,
      count: allJobs.length
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      details: error.message
    });
  }
});

/**
 * Async function to generate game
 */
async function generateGameAsync(jobId, gameType, gameName, requirements) {
  const updateJob = (updates) => {
    const job = jobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date().toISOString() });
      jobs.set(jobId, job);
    }
  };

  const updateStage = (stageName, stageUpdates) => {
    const job = jobs.get(jobId);
    if (job) {
      const stageIndex = job.stages.findIndex(s => s.name === stageName);
      if (stageIndex !== -1) {
        Object.assign(job.stages[stageIndex], stageUpdates);
        jobs.set(jobId, job);
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
    const concept = await generator.generateConcept(gameType, gameName, requirements);
    updateStage('concept', {
      status: 'completed',
      progress: 100,
      data: concept
    });
    updateJob({ progress: 30 });

    // Stage 3: Game Mechanics
    updateStage('mechanics', { status: 'in-progress', progress: 0 });
    const mechanics = await generator.generateMechanics(gameType, concept);
    updateStage('mechanics', {
      status: 'completed',
      progress: 100,
      data: mechanics
    });
    updateJob({ progress: 50 });

    // Stage 4: Asset Generation
    updateStage('assets', { status: 'in-progress', progress: 0 });
    const assets = await generator.generateAssets(gameType, concept);
    updateStage('assets', {
      status: 'completed',
      progress: 100,
      data: assets
    });
    updateJob({ progress: 70 });

    // Stage 5: Code Generation
    updateStage('code-generation', { status: 'in-progress', progress: 0 });
    const code = await generator.generateCode(gameType, mechanics, assets);
    updateStage('code-generation', {
      status: 'completed',
      progress: 100,
      data: code
    });
    updateJob({ progress: 85 });

    // Stage 6: Integration
    updateStage('integration', { status: 'in-progress', progress: 0 });
    const finalGame = await generator.integrateGame(concept, mechanics, assets, code);
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

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    updateJob({
      status: 'failed',
      error: error.message
    });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎮 GAMECHAMBER Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

export default app;
