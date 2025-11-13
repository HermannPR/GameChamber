import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Game Library Service
 * Manages persistent storage of generated games
 *
 * Architecture:
 * - In-memory index for fast access
 * - File-based persistence (JSON + HTML files)
 * - Designed for future migration to S3/database
 */

export class GameLibrary extends EventEmitter {
  constructor(options = {}) {
    super();

    this.libraryPath = options.libraryPath || path.join(__dirname, '../library');
    this.gamesPath = path.join(this.libraryPath, 'games');
    this.metadataPath = path.join(this.libraryPath, 'metadata.json');

    // In-memory index
    this.games = new Map();

    // Statistics
    this.stats = {
      totalGames: 0,
      totalPlays: 0,
      totalDownloads: 0
    };

    this.initialized = false;
  }

  /**
   * Initialize library (create directories, load metadata)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create library directories
      await fs.mkdir(this.libraryPath, { recursive: true });
      await fs.mkdir(this.gamesPath, { recursive: true });

      // Load existing metadata
      await this.loadMetadata();

      this.initialized = true;
      console.log(`📚 Game Library initialized: ${this.games.size} games loaded`);
    } catch (error) {
      console.error('Failed to initialize game library:', error);
      throw error;
    }
  }

  /**
   * Load metadata from disk
   */
  async loadMetadata() {
    try {
      const data = await fs.readFile(this.metadataPath, 'utf-8');
      const metadata = JSON.parse(data);

      this.games = new Map(metadata.games || []);
      this.stats = metadata.stats || this.stats;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Failed to load metadata:', error.message);
      }
      // File doesn't exist yet, start fresh
    }
  }

  /**
   * Save metadata to disk
   */
  async saveMetadata() {
    try {
      const metadata = {
        games: Array.from(this.games.entries()),
        stats: this.stats,
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(
        this.metadataPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save metadata:', error);
      throw error;
    }
  }

  /**
   * Add a game to the library
   * @param {Object} gameData - Game data with files, metadata, etc.
   * @param {String} userId - User ID (for multi-tenant support)
   * @returns {Object} Library entry
   */
  async addGame(gameData, userId = 'anonymous') {
    if (!this.initialized) {
      await this.initialize();
    }

    const gameId = gameData.metadata?.id || this.generateGameId();
    const timestamp = new Date().toISOString();

    // Create library entry
    const libraryEntry = {
      id: gameId,
      userId,
      title: gameData.metadata?.name || gameData.gameName || 'Untitled Game',
      type: gameData.gameType || 'unknown',
      description: gameData.concept?.overview || 'AI-generated game',
      thumbnail: null, // Will be generated async
      filePath: `${gameId}.html`,
      fileSize: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      playCount: 0,
      downloadCount: 0,
      tags: this.extractTags(gameData),
      apiUsed: gameData.apiUsed || 'unknown',
      metadata: {
        jobId: gameData.jobId,
        concept: gameData.concept,
        mechanics: gameData.mechanics,
        version: gameData.metadata?.version || '1.0.0'
      }
    };

    // Save game HTML file
    const htmlPath = path.join(this.gamesPath, libraryEntry.filePath);
    const gameHTML = this.createStandaloneHTML(gameData);

    await fs.writeFile(htmlPath, gameHTML, 'utf-8');
    libraryEntry.fileSize = Buffer.byteLength(gameHTML, 'utf-8');

    // Add to index
    this.games.set(gameId, libraryEntry);
    this.stats.totalGames++;

    // Save metadata
    await this.saveMetadata();

    // Emit event
    this.emit('gameAdded', libraryEntry);

    console.log(`📚 Added game to library: ${libraryEntry.title} (${gameId})`);

    return libraryEntry;
  }

  /**
   * Get a game from library
   */
  async getGame(gameId) {
    if (!this.initialized) {
      await this.initialize();
    }

    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found in library');
    }

    return game;
  }

  /**
   * Get game HTML content
   */
  async getGameHTML(gameId) {
    const game = await this.getGame(gameId);
    const htmlPath = path.join(this.gamesPath, game.filePath);

    try {
      const html = await fs.readFile(htmlPath, 'utf-8');

      // Increment play count
      game.playCount++;
      this.stats.totalPlays++;
      await this.saveMetadata();

      return html;
    } catch (error) {
      console.error(`Failed to read game HTML: ${gameId}`, error);
      throw new Error('Game file not found');
    }
  }

  /**
   * List games with pagination and filtering
   */
  async listGames(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      userId = null,
      type = null,
      search = null,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = options;

    let games = Array.from(this.games.values());

    // Filter by user
    if (userId) {
      games = games.filter(g => g.userId === userId);
    }

    // Filter by type
    if (type) {
      games = games.filter(g => g.type === type);
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      games = games.filter(g =>
        g.title.toLowerCase().includes(searchLower) ||
        g.description.toLowerCase().includes(searchLower) ||
        g.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    games.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });

    // Paginate
    const total = games.length;
    const paginatedGames = games.slice(offset, offset + limit);

    return {
      games: paginatedGames,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  /**
   * Update game metadata
   */
  async updateGame(gameId, updates) {
    const game = await this.getGame(gameId);

    // Update allowed fields
    const allowedFields = ['title', 'description', 'tags'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        game[field] = updates[field];
      }
    });

    game.updatedAt = new Date().toISOString();

    await this.saveMetadata();

    this.emit('gameUpdated', game);

    return game;
  }

  /**
   * Delete game from library
   */
  async deleteGame(gameId) {
    const game = await this.getGame(gameId);
    const htmlPath = path.join(this.gamesPath, game.filePath);

    // Delete file
    try {
      await fs.unlink(htmlPath);
    } catch (error) {
      console.warn('Failed to delete game file:', error.message);
    }

    // Remove from index
    this.games.delete(gameId);
    this.stats.totalGames--;

    await this.saveMetadata();

    this.emit('gameDeleted', gameId);

    console.log(`📚 Deleted game from library: ${game.title} (${gameId})`);

    return true;
  }

  /**
   * Increment download count
   */
  async incrementDownloads(gameId) {
    const game = await this.getGame(gameId);
    game.downloadCount++;
    this.stats.totalDownloads++;
    await this.saveMetadata();
  }

  /**
   * Get library statistics
   */
  async getStats(userId = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    const allGames = Array.from(this.games.values());
    const userGames = userId ? allGames.filter(g => g.userId === userId) : allGames;

    const typeBreakdown = {};
    userGames.forEach(game => {
      typeBreakdown[game.type] = (typeBreakdown[game.type] || 0) + 1;
    });

    return {
      total: userGames.length,
      byType: typeBreakdown,
      totalPlays: userGames.reduce((sum, g) => sum + g.playCount, 0),
      totalDownloads: userGames.reduce((sum, g) => sum + g.downloadCount, 0),
      mostPlayed: userGames.sort((a, b) => b.playCount - a.playCount).slice(0, 5),
      recentlyAdded: userGames.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 5)
    };
  }

  /**
   * Create standalone HTML file with all assets embedded
   */
  createStandaloneHTML(gameData) {
    const { files } = gameData;

    // Create self-contained HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${this.escapeHtml(gameData.concept?.overview || 'AI-generated game')}">
    <title>${this.escapeHtml(gameData.metadata?.name || 'Game')}</title>
    <style>
        ${files['style.css'] || ''}
    </style>
</head>
<body>
    ${files['index.html'] ? this.extractBodyContent(files['index.html']) : '<div id="game-container"></div>'}

    <script>
        ${files['game.js'] || ''}
    </script>

    <!-- Metadata for GAMECHAMBER -->
    <script type="application/json" id="game-metadata">
        ${JSON.stringify({
          title: gameData.metadata?.name || 'Game',
          type: gameData.gameType,
          version: gameData.metadata?.version || '1.0.0',
          createdBy: 'GAMECHAMBER',
          apiUsed: gameData.apiUsed,
          generatedAt: new Date().toISOString()
        }, null, 2)}
    </script>
</body>
</html>`;

    return html;
  }

  /**
   * Extract body content from HTML
   */
  extractBodyContent(html) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : html;
  }

  /**
   * Extract tags from game data
   */
  extractTags(gameData) {
    const tags = [];

    // Add game type
    if (gameData.gameType) {
      tags.push(gameData.gameType);
    }

    // Add API used
    if (gameData.apiUsed) {
      tags.push(gameData.apiUsed);
    }

    // Add theme
    if (gameData.concept?.theme) {
      tags.push(gameData.concept.theme);
    }

    return tags;
  }

  /**
   * Generate unique game ID
   */
  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Clear entire library (admin only)
   */
  async clearLibrary() {
    console.log('⚠️  Clearing entire game library...');

    // Delete all game files
    const games = Array.from(this.games.values());
    for (const game of games) {
      try {
        const htmlPath = path.join(this.gamesPath, game.filePath);
        await fs.unlink(htmlPath);
      } catch (error) {
        console.warn(`Failed to delete game file: ${game.id}`);
      }
    }

    // Clear index
    this.games.clear();
    this.stats = {
      totalGames: 0,
      totalPlays: 0,
      totalDownloads: 0
    };

    await this.saveMetadata();

    this.emit('libraryCleared');

    console.log('✅ Library cleared');
  }
}

export default GameLibrary;
