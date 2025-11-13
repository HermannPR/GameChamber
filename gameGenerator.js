import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTemplate } from './templates/gameTemplates.js';

/**
 * GameGenerator class - Orchestrates AI calls to generate complete games
 * Supports fallback chain: Gemini API (primary) -> Claude API (secondary) -> Cached Templates (fallback)
 */
export class GameGenerator {
  constructor({ geminiApiKey, claudeApiKey }) {
    this.geminiApiKey = geminiApiKey;
    this.claudeApiKey = claudeApiKey;
    this.usedFallback = false;
    this.apiUsed = null;

    if (this.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt, options = {}) {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.7,
        }
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API call failed: ${error.message}`);
    }
  }

  /**
   * Call Claude API (fallback)
   */
  async callClaude(prompt, options = {}) {
    if (!this.claudeApiKey) {
      throw new Error('Claude API not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 2048,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API returned ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Claude API call failed: ${error.message}`);
    }
  }

  /**
   * Smart AI call - tries Gemini first, falls back to Claude, then to templates
   * Fallback chain: Gemini -> Claude -> Cached Templates
   */
  async callAI(prompt, options = {}, gameType = null) {
    // Try Gemini first
    if (this.geminiApiKey) {
      try {
        console.log('🔵 Attempting Gemini API...');
        const result = await this.callGemini(prompt, options);
        this.apiUsed = 'gemini';
        console.log('✅ Gemini API succeeded');
        return result;
      } catch (error) {
        console.warn('⚠️  Gemini API failed:', error.message);
      }
    }

    // Try Claude as secondary fallback
    if (this.claudeApiKey) {
      try {
        console.log('🟣 Attempting Claude API...');
        const result = await this.callClaude(prompt, options);
        this.apiUsed = 'claude';
        console.log('✅ Claude API succeeded');
        return result;
      } catch (error) {
        console.warn('⚠️  Claude API failed:', error.message);
      }
    }

    // Final fallback: Return null to trigger template usage
    // The caller will handle template fallback
    console.warn('⚠️  All AI APIs failed, caller will use cached templates');
    this.usedFallback = true;
    this.apiUsed = 'template';
    return null;
  }

  /**
   * Generate game concept
   */
  async generateConcept(gameType, gameName, requirements) {
    console.log(`Generating concept for ${gameType} game: ${gameName}`);

    const prompt = `You are an expert game designer. Create a detailed game concept for a ${gameType} game called "${gameName}".

Game Type: ${gameType}
Additional Requirements: ${JSON.stringify(requirements, null, 2)}

Please provide a comprehensive game concept including:
1. Game Overview (2-3 sentences)
2. Core Theme and Setting
3. Target Audience
4. Unique Selling Points (3-5 points)
5. Visual Style Description
6. Audio/Music Style
7. Key Features (5-7 features)

Format your response as JSON with the following structure:
{
  "overview": "string",
  "theme": "string",
  "setting": "string",
  "targetAudience": "string",
  "uniqueSellingPoints": ["string"],
  "visualStyle": "string",
  "audioStyle": "string",
  "keyFeatures": ["string"]
}`;

    try {
      const response = await this.callAI(prompt, {}, gameType);

      // If response is null, all APIs failed - use template
      if (response === null) {
        console.log('📦 Using cached template for concept');
        const template = getTemplate(gameType);
        return template.concept;
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if no JSON found - use template
      console.log('📦 Could not parse AI response, using cached template');
      const template = getTemplate(gameType);
      return template.concept;
    } catch (error) {
      console.error('Concept generation error:', error);
      // Final fallback to template
      console.log('📦 Error occurred, using cached template');
      const template = getTemplate(gameType);
      return template.concept;
    }
  }

  /**
   * Generate game mechanics
   */
  async generateMechanics(gameType, concept) {
    console.log(`Generating mechanics for ${gameType} game`);

    const mechanicsPrompts = {
      platformer: `Based on this platformer game concept: ${JSON.stringify(concept)}

Generate detailed game mechanics including:
1. Player Controls (movement, jumping, special abilities)
2. Physics System (gravity, collision, momentum)
3. Level Design Principles
4. Power-ups and Collectibles
5. Enemy Behaviors
6. Scoring System
7. Difficulty Progression

Format as JSON:
{
  "playerControls": { "movement": "string", "jumping": "string", "abilities": ["string"] },
  "physics": { "gravity": "number", "jumpForce": "number", "maxSpeed": "number" },
  "levelDesign": ["principle1", "principle2"],
  "powerUps": [{ "name": "string", "effect": "string" }],
  "enemies": [{ "type": "string", "behavior": "string" }],
  "scoring": { "basePoints": "number", "multipliers": ["string"] },
  "difficulty": { "progression": "string", "levels": "number" }
}`,

      rpg: `Based on this RPG game concept: ${JSON.stringify(concept)}

Generate detailed game mechanics including:
1. Character System (stats, classes, progression)
2. Combat Mechanics (turn-based/real-time, skills, strategy)
3. Inventory and Equipment
4. Quest System
5. NPC Interactions
6. World Exploration
7. Leveling and Experience

Format as JSON with appropriate structure.`,

      puzzle: `Based on this puzzle game concept: ${JSON.stringify(concept)}

Generate detailed game mechanics including:
1. Puzzle Types and Variations
2. Core Game Rules
3. Difficulty Scaling
4. Hint System
5. Time/Move Constraints
6. Combo/Scoring System
7. Level Progression

Format as JSON with appropriate structure.`
    };

    const prompt = mechanicsPrompts[gameType] || mechanicsPrompts.platformer;

    try {
      const response = await this.callAI(prompt, { maxTokens: 3000 }, gameType);

      // If response is null, use template
      if (response === null) {
        console.log('📦 Using cached template for mechanics');
        const template = getTemplate(gameType);
        return template.mechanics;
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to template
      console.log('📦 Could not parse AI response, using cached template');
      const template = getTemplate(gameType);
      return template.mechanics;
    } catch (error) {
      console.error('Mechanics generation error:', error);
      console.log('📦 Error occurred, using cached template');
      const template = getTemplate(gameType);
      return template.mechanics;
    }
  }

  /**
   * Generate game assets specification
   */
  async generateAssets(gameType, concept) {
    console.log(`Generating assets for ${gameType} game`);

    const prompt = `Based on this game concept: ${JSON.stringify(concept)}

Generate a comprehensive asset list for the game including:
1. Visual Assets (sprites, backgrounds, UI elements)
2. Audio Assets (music tracks, sound effects)
3. Font Requirements
4. Animation Requirements
5. Asset Specifications (dimensions, formats)

Format as JSON:
{
  "visual": {
    "sprites": [{ "name": "string", "description": "string", "size": "string" }],
    "backgrounds": [{ "name": "string", "description": "string" }],
    "ui": [{ "name": "string", "purpose": "string" }]
  },
  "audio": {
    "music": [{ "name": "string", "mood": "string", "loop": boolean }],
    "sfx": [{ "name": "string", "trigger": "string" }]
  },
  "fonts": [{ "name": "string", "usage": "string" }],
  "animations": [{ "name": "string", "frames": number, "duration": "string" }]
}`;

    try {
      const response = await this.callAI(prompt, { maxTokens: 2500 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback assets
      return {
        visual: {
          sprites: [
            { name: "player", description: "Main character sprite", size: "32x32" },
            { name: "enemy", description: "Enemy sprite", size: "32x32" },
            { name: "coin", description: "Collectible coin", size: "16x16" }
          ],
          backgrounds: [
            { name: "level1-bg", description: "First level background" }
          ],
          ui: [
            { name: "health-bar", purpose: "Display player health" },
            { name: "score-display", purpose: "Show current score" }
          ]
        },
        audio: {
          music: [
            { name: "main-theme", mood: "Upbeat and energetic", loop: true }
          ],
          sfx: [
            { name: "jump", trigger: "Player jumps" },
            { name: "collect", trigger: "Collect item" }
          ]
        },
        fonts: [
          { name: "game-font", usage: "UI and scores" }
        ],
        animations: [
          { name: "player-walk", frames: 4, duration: "0.4s" },
          { name: "player-jump", frames: 2, duration: "0.3s" }
        ]
      };
    } catch (error) {
      console.error('Assets generation error:', error);
      throw error;
    }
  }

  /**
   * Generate game code
   */
  async generateCode(gameType, mechanics, assets) {
    console.log(`Generating code for ${gameType} game`);

    const prompt = `Generate production-ready game code using HTML5 Canvas and vanilla JavaScript.

Game Type: ${gameType}
Mechanics: ${JSON.stringify(mechanics, null, 2)}
Assets: ${JSON.stringify(assets, null, 2)}

Generate complete, working game code including:
1. HTML structure
2. CSS styling
3. JavaScript game engine
4. Game loop
5. Collision detection
6. Score tracking
7. User input handling

Provide the code in this JSON format:
{
  "html": "complete HTML code",
  "css": "complete CSS code",
  "javascript": "complete JavaScript game code",
  "instructions": "How to run and play the game"
}

Make sure the game is fully functional and can run in a modern web browser.`;

    try {
      const response = await this.callAI(prompt, { maxTokens: 4000, temperature: 0.8 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback code template
      return {
        html: this.getTemplateHTML(gameType),
        css: this.getTemplateCSS(),
        javascript: this.getTemplateJS(gameType),
        instructions: "Open the HTML file in a modern web browser to play. Use arrow keys or WASD to move."
      };
    } catch (error) {
      console.error('Code generation error:', error);
      // Return template on error
      return {
        html: this.getTemplateHTML(gameType),
        css: this.getTemplateCSS(),
        javascript: this.getTemplateJS(gameType),
        instructions: "Open the HTML file in a modern web browser to play."
      };
    }
  }

  /**
   * Integrate all components into final game
   */
  async integrateGame(concept, mechanics, assets, code) {
    console.log('Integrating final game...');

    return {
      metadata: {
        name: concept.overview || 'Generated Game',
        type: concept.theme || 'game',
        created: new Date().toISOString(),
        version: '1.0.0'
      },
      concept,
      mechanics,
      assets,
      code,
      files: {
        'index.html': code.html,
        'style.css': code.css,
        'game.js': code.javascript,
        'README.md': this.generateReadme(concept, code.instructions)
      }
    };
  }

  /**
   * Generate README file
   */
  generateReadme(concept, instructions) {
    return `# ${concept.overview || 'Generated Game'}

## About
${concept.overview || 'An AI-generated game created with GAMECHAMBER.'}

## Theme
${concept.theme || 'Adventure'}

## Features
${concept.keyFeatures ? concept.keyFeatures.map(f => `- ${f}`).join('\n') : '- Engaging gameplay\n- Progressive difficulty\n- Score tracking'}

## How to Play
${instructions || 'Open index.html in a web browser.'}

## Controls
- Arrow Keys / WASD: Movement
- Space: Jump/Action
- ESC: Pause

## Credits
Generated by GAMECHAMBER - AI-Powered Game Generation Platform

---
Created with ❤️ using AI
`;
  }

  /**
   * Template HTML for fallback
   */
  getTemplateHTML(gameType) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameType} Game - GAMECHAMBER</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            <h1>${gameType.toUpperCase()} GAME</h1>
            <div class="stats">
                <span>Score: <span id="score">0</span></span>
                <span>Lives: <span id="lives">3</span></span>
            </div>
        </div>
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        <div class="game-controls">
            <p>Controls: Arrow Keys or WASD to move, Space to jump</p>
            <button id="startBtn">Start Game</button>
            <button id="pauseBtn">Pause</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>`;
  }

  /**
   * Template CSS for fallback
   */
  getTemplateCSS() {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.game-container {
    background: white;
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.3);
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 10px;
}

.game-header h1 {
    color: #667eea;
    font-size: 24px;
}

.stats {
    display: flex;
    gap: 20px;
    font-weight: bold;
}

#gameCanvas {
    border: 3px solid #667eea;
    border-radius: 10px;
    background: #87ceeb;
    display: block;
}

.game-controls {
    margin-top: 15px;
    text-align: center;
}

.game-controls p {
    margin-bottom: 10px;
    color: #666;
}

.game-controls button {
    margin: 0 5px;
    padding: 10px 20px;
    font-size: 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
}

.game-controls button:hover {
    background: #764ba2;
}`;
  }

  /**
   * Template JavaScript for fallback
   */
  getTemplateJS(gameType) {
    return `// ${gameType.toUpperCase()} Game - Generated by GAMECHAMBER
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');

let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;

// Player object
const player = {
    x: 50,
    y: canvas.height - 100,
    width: 30,
    height: 30,
    color: '#ff6b6b',
    velocityY: 0,
    velocityX: 0,
    speed: 5,
    jumpPower: 12,
    gravity: 0.5,
    isJumping: false
};

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && !player.isJumping && gameRunning) {
        player.velocityY = -player.jumpPower;
        player.isJumping = true;
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game objects
let obstacles = [];
let collectibles = [];

// Create obstacle
function createObstacle() {
    obstacles.push({
        x: canvas.width,
        y: canvas.height - 80,
        width: 30,
        height: 50,
        color: '#4ecdc4',
        speed: 3
    });
}

// Create collectible
function createCollectible() {
    collectibles.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 200) + 50,
        radius: 10,
        color: '#ffd700',
        speed: 2
    });
}

// Update game state
function update() {
    if (!gameRunning || gamePaused) return;

    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.velocityX = -player.speed;
    else if (keys['ArrowRight'] || keys['d']) player.velocityX = player.speed;
    else player.velocityX = 0;

    player.x += player.velocityX;
    player.velocityY += player.gravity;
    player.y += player.velocityY;

    // Ground collision
    if (player.y + player.height >= canvas.height - 50) {
        player.y = canvas.height - 50 - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Update obstacles
    obstacles.forEach((obs, index) => {
        obs.x -= obs.speed;
        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
            score += 10;
            scoreDisplay.textContent = score;
        }

        // Collision detection
        if (player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y) {
            lives--;
            livesDisplay.textContent = lives;
            obstacles.splice(index, 1);
            if (lives <= 0) gameOver();
        }
    });

    // Update collectibles
    collectibles.forEach((col, index) => {
        col.x -= col.speed;
        if (col.x + col.radius < 0) {
            collectibles.splice(index, 1);
        }

        // Collection detection
        const dist = Math.sqrt(
            Math.pow(player.x + player.width/2 - col.x, 2) +
            Math.pow(player.y + player.height/2 - col.y, 2)
        );
        if (dist < player.width/2 + col.radius) {
            score += 50;
            scoreDisplay.textContent = score;
            collectibles.splice(index, 1);
        }
    });

    // Spawn objects
    if (Math.random() < 0.02) createObstacle();
    if (Math.random() < 0.01) createCollectible();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Draw collectibles
    collectibles.forEach(col => {
        ctx.fillStyle = col.color;
        ctx.beginPath();
        ctx.arc(col.x, col.y, col.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw pause text
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    obstacles = [];
    collectibles = [];
    player.x = 50;
    player.y = canvas.height - 100;
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    startBtn.textContent = 'Restart';
}

// Game over
function gameOver() {
    gameRunning = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 30);
    ctx.font = '24px Arial';
    ctx.fillText('Final Score: ' + score, canvas.width/2, canvas.height/2 + 20);
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
    }
});

// Start game loop
gameLoop();
console.log('${gameType} game loaded successfully!');`;
  }
}

export default GameGenerator;
