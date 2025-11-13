# 🌌 DreamExplorer

**AI-generated immersive 3D emotional experiences**

DreamExplorer is a revolutionary platform that generates personalized 3D environments designed to evoke specific emotional states. Using AI to interpret emotional needs and procedural generation to create unique spaces, DreamExplorer helps users meditate, heal, explore, and feel.

## ✨ What is DreamExplorer?

DreamExplorer generates **dreams** - immersive first-person 3D experiences focused on emotion rather than gameplay. No objectives, no scores, no failure states. Just beautiful, atmospheric spaces to explore at your own pace.

### Use Cases

- 🧘 **Meditation & Mindfulness** - Calming spaces for meditation
- 💚 **Mental Health** - Therapeutic visualizations for anxiety, grief, stress
- 🎨 **Creative Inspiration** - Visualize abstract concepts, emotions, music
- 💭 **Memory Preservation** - Recreate meaningful places from your past
- 😴 **Sleep Aid** - Gentle experiences to help you fall asleep
- 🌟 **Pure Exploration** - Discover fantastical worlds

## 🎯 Core Philosophy

> "We are not making games to win. We are making spaces to feel."

- **AI describes emotion** → System generates environment
- **No code generation** → AI outputs compact TOML definitions
- **Procedural variety** → Infinite unique experiences
- **User agency** → Explore freely, exit anytime
- **Privacy-first** → Your dreams stay with you

## 🛠️ Technology Stack

### Core
- **Three.js** - 3D rendering engine
- **TOML** - Human-readable dream definitions
- **TypeScript** - Type-safe development
- **Vite** - Fast build system

### Procedural Generation
- **Simplex Noise** - Natural terrain generation
- **L-Systems** - Recursive vegetation
- **Marching Cubes** - Smooth organic terrain
- **Poisson Sampling** - Natural object distribution

### Audio
- **Tone.js** - Procedural music & sound effects
- **Web Audio API** - 3D spatial audio

### Storage
- **IndexedDB** (via localForage) - Save dreams locally

## 📋 Features

### Current (MVP - In Progress)
- ⏳ Procedural 3D terrain generation
- ⏳ First-person exploration controls
- ⏳ Atmospheric effects (fog, lighting, particles)
- ⏳ Procedural audio & spatial sound
- ⏳ Save/load dream library
- ⏳ Export dreams (TOML, HTML)
- ⏳ 10+ example dream templates
- ⏳ Mobile support

### Planned (v2.0)
- 🔮 AI-powered dream generation from natural language
- 🔮 VR mode (WebXR)
- 🔮 More biomes (desert, ocean, mountains, caves, space)
- 🔮 Multiplayer dreams
- 🔮 Cloud sync
- 🔮 Guided meditations
- 🔮 Therapist dashboard

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DreamExplorer.git
cd DreamExplorer

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to start exploring dreams!

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## 📖 Usage

### Step 1: Configure API Keys

On first launch, enter your API key(s):
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

You need at least one API key. Both can be configured for redundancy.

### Step 2: Select a Game Template

Choose from 7+ pre-configured game templates:

**Platformers:**
- Sky Runner - Fast-paced cloud jumping
- Cave Explorer - Dark cave adventure

**RPGs:**
- Quest of Heroes - Turn-based combat adventure
- Dungeon Master - Real-time dungeon crawler

**Puzzles:**
- Block Master - Match-3 puzzle game
- Mind Bender - Logic puzzle challenges
- Maze Runner - Procedural maze navigation

### Step 3: Generate Your Game

Click "Generate Game" and watch the AI work through 6 stages:
1. ⚙️ Initialization
2. 💡 Concept Design
3. 🎮 Game Mechanics
4. 🎨 Asset Generation
5. 💻 Code Generation
6. 🔧 Integration

### Step 4: Download & Play

Once complete, download your game files:
- `index.html` - Main game file
- `style.css` - Game styling
- `game.js` - Game logic
- `README.md` - Game documentation

Open `index.html` in any modern browser to play!

## 🏗️ Project Structure

```
GameChamber/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── App.css                 # App styles
│   ├── GameCatalogue.jsx       # Game selection UI
│   ├── GameCatalogue.css       # Catalogue styles
│   ├── ProgressDashboard.jsx   # Real-time progress tracker
│   ├── ProgressDashboard.css   # Dashboard styles
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── server.js                   # Express backend server
├── gameGenerator.js            # AI orchestration logic
├── index.html                  # HTML entry point
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
├── .env.example               # Environment template
└── README.md                  # This file
```

## 🔧 API Endpoints

### POST `/api/setup`
Configure API keys
```json
{
  "geminiApiKey": "your_key",
  "claudeApiKey": "your_key"
}
```

### POST `/api/generate-game`
Start game generation
```json
{
  "gameType": "platformer|rpg|puzzle",
  "gameName": "My Game",
  "requirements": {}
}
```

### GET `/api/status/:jobId`
Get generation status for a specific job

### GET `/api/status`
Get all jobs (debugging)

### GET `/health`
Health check endpoint

## 🎨 Technology Stack

**Frontend:**
- React 18
- Vite (build tool)
- Axios (HTTP client)
- Modern CSS with animations

**Backend:**
- Express.js
- Google Generative AI SDK
- CORS enabled
- UUID for job tracking

**AI Integration:**
- Gemini API (primary)
- Claude API (fallback)
- Async/await patterns
- Error handling & retry logic

## 🔒 Security Notes

- API keys are never stored permanently
- Keys are kept in memory only during session
- Use environment variables for local development
- Never commit `.env` file to version control
- All API calls include error handling

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Verify Node.js version (16+ required)
- Run `npm install` to ensure dependencies are installed

### Frontend shows connection error
- Ensure backend server is running on port 3001
- Check browser console for CORS errors
- Verify API keys are configured correctly

### Game generation fails
- Verify API keys are valid and have quota
- Check server logs for detailed error messages
- Try using the fallback API if one is failing

### API Key errors
- Get a new key from the respective provider
- Ensure key format is correct (no extra spaces)
- Check API quota hasn't been exceeded

## 📝 Development

### Run in development mode
```bash
npm run dev
```

### Run server only
```bash
npm run server
```

### Run client only
```bash
npm run client
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or production purposes.

## 🙏 Acknowledgments

- Powered by Google Gemini API
- Powered by Anthropic Claude API
- Built with React and Express
- UI inspired by modern game development tools

---

**Made with ❤️ by the GAMECHAMBER team**

For issues or questions, please open an issue on GitHub.
