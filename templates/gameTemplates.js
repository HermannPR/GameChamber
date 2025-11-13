/**
 * Cached Game Templates
 * Pre-built game templates used as fallback when AI APIs fail
 */

export const gameTemplates = {
  platformer: {
    concept: {
      overview: "A classic side-scrolling platformer with jumping mechanics and collectibles",
      theme: "Adventure",
      setting: "Colorful fantasy world with platforms and obstacles",
      targetAudience: "Casual gamers of all ages",
      uniqueSellingPoints: [
        "Smooth physics-based movement",
        "Progressive difficulty curve",
        "Collectible system with scoring"
      ],
      visualStyle: "Bright, colorful 2D graphics",
      audioStyle: "Upbeat chiptune-style music",
      keyFeatures: [
        "Responsive jump controls",
        "Multiple obstacle types",
        "Score tracking and leaderboards",
        "Power-up collectibles",
        "Endless runner mode"
      ]
    },
    mechanics: {
      playerControls: {
        movement: "Arrow keys or WASD for horizontal movement",
        jumping: "Spacebar for jumping",
        abilities: ["Double jump", "Sprint"]
      },
      physics: {
        gravity: 0.5,
        jumpForce: 12,
        maxSpeed: 8
      },
      levelDesign: [
        "Gradually increasing difficulty",
        "Mixed platform heights",
        "Strategic collectible placement"
      ],
      powerUps: [
        { name: "Speed Boost", effect: "2x movement speed for 10 seconds" },
        { name: "Shield", effect: "Temporary invincibility" },
        { name: "Double Points", effect: "2x score multiplier" }
      ],
      enemies: [
        { type: "Patroller", behavior: "Moves back and forth on platforms" },
        { type: "Jumper", behavior: "Jumps at random intervals" }
      ],
      scoring: {
        basePoints: 100,
        multipliers: ["Time bonus", "No damage bonus", "Collectible streak"]
      },
      difficulty: {
        progression: "Gradual speed and obstacle density increase",
        levels: 10
      }
    }
  },

  rpg: {
    concept: {
      overview: "A turn-based RPG adventure with character progression and strategic combat",
      theme: "Fantasy Adventure",
      setting: "Medieval fantasy world with dungeons and quests",
      targetAudience: "RPG enthusiasts and strategy game fans",
      uniqueSellingPoints: [
        "Deep character customization",
        "Strategic turn-based combat",
        "Engaging storyline",
        "Multiple character classes"
      ],
      visualStyle: "Pixel art with detailed character sprites",
      audioStyle: "Epic orchestral soundtrack",
      keyFeatures: [
        "Turn-based combat system",
        "Character leveling and skills",
        "Inventory management",
        "Quest system",
        "Multiple enemy types"
      ]
    },
    mechanics: {
      characterSystem: {
        stats: ["HP", "MP", "Attack", "Defense", "Speed"],
        classes: ["Warrior", "Mage", "Rogue"],
        progression: "Experience-based leveling"
      },
      combat: {
        type: "Turn-based",
        actions: ["Attack", "Defend", "Use Item", "Skill"],
        strategy: "Element advantages and status effects"
      },
      inventory: {
        slots: 20,
        categories: ["Weapons", "Armor", "Consumables", "Key Items"]
      },
      quests: [
        { type: "Main Quest", reward: "Story progression" },
        { type: "Side Quest", reward: "Experience and items" }
      ],
      exploration: {
        worldMap: "Grid-based overworld",
        dungeons: "Multi-floor labyrinths",
        npcs: "Interactive characters with dialogue"
      }
    }
  },

  puzzle: {
    concept: {
      overview: "An engaging puzzle game with increasingly complex challenges",
      theme: "Abstract Logic",
      setting: "Clean, minimalist puzzle environment",
      targetAudience: "Puzzle enthusiasts and casual gamers",
      uniqueSellingPoints: [
        "Intuitive gameplay mechanics",
        "Hundreds of unique puzzles",
        "Progressive difficulty",
        "Relaxing yet challenging"
      ],
      visualStyle: "Clean, modern design with smooth animations",
      audioStyle: "Ambient, relaxing background music",
      keyFeatures: [
        "Multiple puzzle types",
        "Hint system",
        "Undo functionality",
        "Time trials mode",
        "Achievement system"
      ]
    },
    mechanics: {
      puzzleTypes: [
        { name: "Match-3", description: "Match three or more similar items" },
        { name: "Pattern Matching", description: "Replicate given patterns" },
        { name: "Logic Puzzles", description: "Solve logic-based challenges" }
      ],
      rules: {
        moveLimit: "Limited moves per puzzle",
        scoring: "Points based on efficiency",
        combos: "Bonus points for chain reactions"
      },
      difficulty: {
        levels: 100,
        scaling: "Complexity increases every 10 levels"
      },
      hints: {
        available: 3,
        regeneration: "One hint per 5 puzzles solved"
      },
      progression: {
        unlocks: "New puzzle types unlock at milestones",
        rewards: "Stars earned based on performance"
      }
    }
  }
};

/**
 * Get template for a specific game type
 */
export function getTemplate(gameType) {
  return gameTemplates[gameType] || gameTemplates.platformer;
}

/**
 * Get all available templates
 */
export function getAllTemplates() {
  return gameTemplates;
}

/**
 * Check if template exists
 */
export function hasTemplate(gameType) {
  return gameType in gameTemplates;
}

export default {
  gameTemplates,
  getTemplate,
  getAllTemplates,
  hasTemplate
};
