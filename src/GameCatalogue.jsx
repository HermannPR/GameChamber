import React from 'react';
import './GameCatalogue.css';

const GAME_TEMPLATES = [
  {
    id: 'platformer-1',
    type: 'platformer',
    name: 'Sky Runner',
    description: 'A fast-paced platformer where you jump across clouds and collect stars while avoiding obstacles.',
    icon: '🏃',
    difficulty: 'Medium',
    features: [
      'Smooth physics-based movement',
      'Progressive difficulty levels',
      'Power-ups and collectibles',
      'Score tracking and achievements'
    ],
    requirements: {
      levels: 5,
      enemies: true,
      powerUps: true
    }
  },
  {
    id: 'platformer-2',
    type: 'platformer',
    name: 'Cave Explorer',
    description: 'Explore mysterious caves, discover hidden treasures, and escape dangerous traps.',
    icon: '⛏️',
    difficulty: 'Hard',
    features: [
      'Dark cave atmosphere',
      'Hidden secrets and passages',
      'Multiple enemy types',
      'Timer-based challenges'
    ],
    requirements: {
      levels: 7,
      enemies: true,
      traps: true
    }
  },
  {
    id: 'rpg-1',
    type: 'rpg',
    name: 'Quest of Heroes',
    description: 'Embark on an epic adventure with turn-based combat, character progression, and quests.',
    icon: '⚔️',
    difficulty: 'Medium',
    features: [
      'Turn-based combat system',
      'Character stats and leveling',
      'Quest and story progression',
      'Inventory management'
    ],
    requirements: {
      combatSystem: 'turn-based',
      characterClasses: 3,
      quests: 10
    }
  },
  {
    id: 'rpg-2',
    type: 'rpg',
    name: 'Dungeon Master',
    description: 'Navigate through procedurally generated dungeons, fight monsters, and collect legendary loot.',
    icon: '🏰',
    difficulty: 'Hard',
    features: [
      'Procedural dungeon generation',
      'Real-time combat',
      'Loot and equipment system',
      'Boss battles'
    ],
    requirements: {
      combatSystem: 'real-time',
      dungeonLevels: 15,
      bosses: true
    }
  },
  {
    id: 'puzzle-1',
    type: 'puzzle',
    name: 'Block Master',
    description: 'Match colored blocks, solve puzzles, and clear the board in this addictive puzzle game.',
    icon: '🧩',
    difficulty: 'Easy',
    features: [
      'Match-3 mechanics',
      'Combo system',
      'Multiple game modes',
      'Progressive difficulty'
    ],
    requirements: {
      puzzleType: 'match-3',
      levels: 30,
      combos: true
    }
  },
  {
    id: 'puzzle-2',
    type: 'puzzle',
    name: 'Mind Bender',
    description: 'Challenge your brain with complex logic puzzles that require strategic thinking.',
    icon: '🧠',
    difficulty: 'Hard',
    features: [
      'Logic-based puzzles',
      'Hint system',
      'Time challenges',
      'Achievement system'
    ],
    requirements: {
      puzzleType: 'logic',
      levels: 50,
      hints: true
    }
  },
  {
    id: 'puzzle-3',
    type: 'puzzle',
    name: 'Maze Runner',
    description: 'Navigate through intricate mazes, collect items, and find the exit before time runs out.',
    icon: '🌀',
    difficulty: 'Medium',
    features: [
      'Procedural maze generation',
      'Time-based challenges',
      'Collectible items',
      'Multiple difficulty levels'
    ],
    requirements: {
      puzzleType: 'maze',
      mazeSize: 'large',
      timeLimits: true
    }
  }
];

function GameCatalogue({ onSelectGame, selectedGame }) {
  const gameTypes = ['all', 'platformer', 'rpg', 'puzzle'];
  const [filter, setFilter] = React.useState('all');

  const filteredGames = filter === 'all'
    ? GAME_TEMPLATES
    : GAME_TEMPLATES.filter(game => game.type === filter);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'hard':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'platformer':
        return '#2196F3';
      case 'rpg':
        return '#9C27B0';
      case 'puzzle':
        return '#FF5722';
      default:
        return '#607D8B';
    }
  };

  return (
    <div className="game-catalogue">
      <div className="catalogue-header">
        <h2>🎯 Select a Game Template</h2>
        <p>Choose from our collection of game templates to get started</p>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        {gameTypes.map(type => (
          <button
            key={type}
            className={`filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? '🎮 All Games' :
             type === 'platformer' ? '🏃 Platformers' :
             type === 'rpg' ? '⚔️ RPGs' :
             '🧩 Puzzles'}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="game-grid">
        {filteredGames.map(game => (
          <div
            key={game.id}
            className={`game-card ${selectedGame?.id === game.id ? 'selected' : ''}`}
            onClick={() => onSelectGame(game)}
          >
            <div className="game-card-header">
              <span className="game-icon">{game.icon}</span>
              <div className="game-badges">
                <span
                  className="game-type-badge"
                  style={{ backgroundColor: getTypeColor(game.type) }}
                >
                  {game.type}
                </span>
                <span
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
                >
                  {game.difficulty}
                </span>
              </div>
            </div>

            <h3 className="game-title">{game.name}</h3>
            <p className="game-description">{game.description}</p>

            <div className="game-features">
              <h4>Features:</h4>
              <ul>
                {game.features.slice(0, 3).map((feature, index) => (
                  <li key={index}>✓ {feature}</li>
                ))}
              </ul>
            </div>

            <div className="game-card-footer">
              {selectedGame?.id === game.id ? (
                <span className="selected-indicator">✓ Selected</span>
              ) : (
                <span className="select-text">Click to select</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="no-games">
          <p>No games found for this category.</p>
        </div>
      )}
    </div>
  );
}

export default GameCatalogue;
