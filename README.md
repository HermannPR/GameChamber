# 🎮 GAMECHAMBER v2.0

**AI-Powered Game Generation Platform with Enterprise Features**

GAMECHAMBER is a production-ready web application that uses AI (Gemini and Claude APIs) to generate complete, playable HTML5 games. Now featuring real-time WebSocket updates, job queue management, JWT authentication, and comprehensive admin controls.

## ✨ New in v2.0

- 🔌 **Real-time WebSocket Updates**: Live progress tracking without polling
- 📦 **ZIP Export**: Download games as complete, playable packages
- 🔐 **JWT Authentication**: Secure admin access with token-based auth
- ⚡ **Job Queue System**: Handle multiple concurrent game generations
- 📊 **Admin Dashboard**: Monitor system stats, queue, and all jobs
- 🔄 **Batch Generation**: Generate multiple games simultaneously
- 🎯 **Smart Fallback Chain**: Gemini → Claude → Cached Templates
- ✅ **Environment Validation**: Startup checks ensure proper configuration
- 🚦 **Rate Limiting**: Built-in API protection
- 🎛️ **Queue Management**: Pause, resume, and adjust concurrency

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- (Optional) Gemini API key and/or Claude API key
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GameChamber
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure (all fields required):
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3001

   # AI API Keys (at least one recommended, but optional with templates)
   GEMINI_API_KEY=your_gemini_api_key_here
   CLAUDE_API_KEY=your_claude_api_key_here

   # Authentication (REQUIRED)
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
   JWT_EXPIRES_IN=7d
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password_min_8_chars

   # Queue Configuration
   MAX_CONCURRENT_JOBS=3
   JOB_TIMEOUT=600000

   # WebSocket Configuration
   WS_CORS_ORIGIN=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Generate JWT Secret** (recommended)
   ```bash
   openssl rand -base64 32
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3001`
   - WebSocket server on `ws://localhost:3001`
   - Frontend dev server on `http://localhost:5173`

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 Usage

### For End Users

#### Step 1: Configure API Keys (Optional)

On first launch, you can enter your API key(s):
- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

**Note**: If you don't have API keys, click "Skip (Use Templates)" to use cached game templates.

#### Step 2: Select a Game Template

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

#### Step 3: Generate Your Game

Click "Generate Game" and watch real-time progress through 6 stages:
1. ⚙️ Initialization
2. 💡 Concept Design
3. 🎮 Game Mechanics
4. 🎨 Asset Generation
5. 💻 Code Generation
6. 🔧 Integration

All updates appear instantly via WebSocket - no page refresh needed!

#### Step 4: Download & Play

Once complete, download your game:
- **📦 Download as ZIP**: Get a complete package with all files
- **📥 Download Individual Files**: Download files separately

The ZIP includes:
- `index.html` - Main game file (open this to play)
- `style.css` - Game styling
- `game.js` - Game logic and mechanics
- `README.md` - Game documentation
- `metadata.json` - Technical metadata
- `HOW_TO_PLAY.txt` - Instructions

Simply unzip and open `index.html` in any modern browser to play!

### For Administrators

#### Access Admin Dashboard

1. Click "Admin Login" in the top-right corner
2. Enter credentials (from `.env` file):
   - Username: `ADMIN_USERNAME`
   - Password: `ADMIN_PASSWORD`

#### Admin Dashboard Features

**Overview Tab:**
- Total, completed, in-progress, and failed jobs statistics
- Current queue status and active jobs
- Average processing time

**Queue Management Tab:**
- Pause/resume queue processing
- Adjust max concurrent jobs (1-10)
- View all queued jobs with priorities

**All Jobs Tab:**
- Paginated list of all jobs
- Filter by status
- View job details and progress

**System Info Tab:**
- Server uptime and Node version
- Memory usage statistics
- Configuration summary
- API status

## 🏗️ Project Structure

```
GameChamber/
├── src/
│   ├── App.jsx                    # Main application (WebSocket integrated)
│   ├── GameCatalogue.jsx          # Game selection UI
│   ├── ProgressDashboard.jsx      # Real-time progress tracker
│   ├── AdminDashboard.jsx         # Admin control panel (NEW)
│   └── *.css                      # Component styles
├── server.js                      # Express + Socket.IO server (UPGRADED)
├── gameGenerator.js               # AI orchestration with fallback chain
├── config/
│   └── envValidator.js            # Environment validation (NEW)
├── middleware/
│   └── auth.js                    # JWT authentication (NEW)
├── controllers/
│   └── authController.js          # Auth endpoints (NEW)
├── services/
│   ├── jobQueue.js                # Job queue system (NEW)
│   └── zipExporter.js             # ZIP file generation (NEW)
├── templates/
│   └── gameTemplates.js           # Cached game templates (NEW)
├── .env.example                   # Environment template
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🔧 API Endpoints

### Authentication

#### POST `/api/auth/login`
Authenticate and receive JWT token
```json
{
  "username": "admin",
  "password": "your_password"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "username": "admin",
    "isAdmin": true
  },
  "expiresIn": "7d"
}
```

#### POST `/api/auth/verify`
Verify token validity (requires Authorization header)

#### POST `/api/auth/refresh`
Refresh expired token (requires Authorization header)

#### GET `/api/auth/me`
Get current user info (requires Authorization header)

### Game Generation

#### POST `/api/setup`
Configure API keys (optional)
```json
{
  "geminiApiKey": "your_key",
  "claudeApiKey": "your_key"
}
```

#### POST `/api/generate-game`
Start single game generation
```json
{
  "gameType": "platformer|rpg|puzzle",
  "gameName": "My Game",
  "requirements": {},
  "priority": 0
}
```

Response:
```json
{
  "success": true,
  "jobId": "uuid",
  "message": "Game generation queued",
  "status": "pending",
  "queuePosition": 1
}
```

#### POST `/api/generate-batch`
Generate multiple games (requires authentication)
```json
{
  "games": [
    {
      "gameType": "platformer",
      "gameName": "Game 1",
      "priority": 5
    },
    {
      "gameType": "rpg",
      "gameName": "Game 2",
      "priority": 3
    }
  ]
}
```

Max 10 games per batch.

#### GET `/api/status/:jobId`
Get job status and progress

#### GET `/api/download/:jobId`
Download game as ZIP file

#### DELETE `/api/jobs/:jobId`
Cancel a job (requires authentication)

### Admin Endpoints (Require Authentication + Admin Role)

#### GET `/api/admin/stats`
Get comprehensive system statistics

#### GET `/api/admin/jobs?limit=50&offset=0&status=completed`
Get paginated job list with optional filtering

#### POST `/api/admin/queue/pause`
Pause queue processing

#### POST `/api/admin/queue/resume`
Resume queue processing

#### PUT `/api/admin/queue/concurrency`
Update max concurrent jobs
```json
{
  "maxConcurrent": 5
}
```

### Utility Endpoints

#### GET `/health`
Health check with queue status

#### GET `/api/info`
System information and features list

## 🔌 WebSocket Events

Connect to `ws://localhost:3001`

### Client → Server

- `subscribe`: Join job updates room
  ```javascript
  socket.emit('subscribe', jobId)
  ```

- `unsubscribe`: Leave job updates room
  ```javascript
  socket.emit('unsubscribe', jobId)
  ```

### Server → Client

- `jobUpdate`: Overall job status changed
  ```javascript
  {
    jobId: 'uuid',
    status: 'processing|completed|failed',
    progress: 50,
    result: {...},
    error: 'message'
  }
  ```

- `stageUpdate`: Individual stage progress
  ```javascript
  {
    jobId: 'uuid',
    stage: 'concept',
    status: 'in-progress',
    progress: 75
  }
  ```

## 🎨 Technology Stack

**Frontend:**
- React 18 with Hooks
- Socket.IO Client (WebSocket)
- Axios (HTTP client)
- Vite (build tool)
- Modern CSS with animations

**Backend:**
- Express.js
- Socket.IO (WebSocket server)
- JWT (jsonwebtoken)
- Bcrypt (password hashing)
- Joi (validation)
- Archiver (ZIP generation)
- Google Generative AI SDK
- CORS enabled
- UUID for job tracking

**AI Integration:**
- Gemini API (primary)
- Claude API (secondary fallback)
- Cached Templates (final fallback)
- Async/await patterns
- Comprehensive error handling

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing
- ✅ Environment variable validation
- ✅ Rate limiting (configurable)
- ✅ Input validation with Joi
- ✅ CORS configuration
- ✅ Secure admin routes
- ✅ API key memory-only storage
- ✅ Request authentication middleware
- ❌ API keys never logged or persisted to disk

## ⚙️ Configuration

All configuration via `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3001` | Server port |
| `GEMINI_API_KEY` | No* | - | Gemini API key |
| `CLAUDE_API_KEY` | No* | - | Claude API key |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration time |
| `ADMIN_USERNAME` | No | `admin` | Admin username |
| `ADMIN_PASSWORD` | Yes | - | Admin password (8+ chars) |
| `MAX_CONCURRENT_JOBS` | No | `3` | Max parallel jobs (1-10) |
| `JOB_TIMEOUT` | No | `600000` | Job timeout (ms) |
| `WS_CORS_ORIGIN` | No | `http://localhost:5173` | WebSocket CORS |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

\* At least one API key OR use cached templates

## 🐛 Troubleshooting

### Environment Validation Errors

The server validates all environment variables on startup. If validation fails:

1. Check `.env` file exists
2. Ensure all required fields are set
3. Verify `JWT_SECRET` is at least 32 characters
4. Verify `ADMIN_PASSWORD` is at least 8 characters
5. Use `.env.example` as reference

### WebSocket Connection Issues

If real-time updates don't work:

1. Check browser console for connection errors
2. Ensure `WS_CORS_ORIGIN` matches your frontend URL
3. Verify firewall isn't blocking WebSocket connections
4. Try a different browser

### Authentication Failures

If admin login fails:

1. Verify credentials match `.env` file
2. Check JWT_SECRET is properly configured
3. Clear browser cookies/local storage
4. Restart server to reinitialize admin user

### Job Queue Issues

If jobs aren't processing:

1. Check admin dashboard for queue status
2. Verify queue isn't paused
3. Check server logs for errors
4. Adjust `MAX_CONCURRENT_JOBS` if needed

### API Fallback Chain

If game generation uses templates when you have API keys:

1. Verify API keys are valid
2. Check API quota hasn't been exceeded
3. Review server logs for API errors
4. Test API keys directly with provider

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

## 🧪 Testing

### Test Environment Validation
```bash
# Missing required fields should fail
node -e "require('./config/envValidator.js').getConfig()"
```

### Test Authentication
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### Test Queue System
```bash
# Check queue status
curl http://localhost:3001/health
```

### Test ZIP Export
```bash
# Generate game then download
curl http://localhost:3001/api/download/JOB_ID -o game.zip
```

## 🚀 Deployment

### Production Checklist

- [ ] Generate strong JWT secret (32+ chars)
- [ ] Set strong admin password
- [ ] Configure production API keys
- [ ] Set `NODE_ENV=production`
- [ ] Adjust `MAX_CONCURRENT_JOBS` based on server capacity
- [ ] Configure appropriate `RATE_LIMIT_MAX_REQUESTS`
- [ ] Set correct `WS_CORS_ORIGIN` for your domain
- [ ] Build frontend: `npm run build`
- [ ] Use process manager (PM2, systemd)
- [ ] Set up SSL/TLS for WebSocket
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Regular backups of job data

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
GEMINI_API_KEY=<production-key>
CLAUDE_API_KEY=<production-key>
JWT_SECRET=<strong-secret-32plus-chars>
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=<custom-admin>
ADMIN_PASSWORD=<strong-password>
MAX_CONCURRENT_JOBS=5
JOB_TIMEOUT=600000
WS_CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or production purposes.

## 🙏 Acknowledgments

- Powered by Google Gemini API
- Powered by Anthropic Claude API
- Built with React, Express, and Socket.IO
- UI inspired by modern game development tools

## 📊 Changelog

### v2.0.0 (Current)
- ✨ Added WebSocket real-time updates
- ✨ Added JWT authentication system
- ✨ Added admin dashboard with system monitoring
- ✨ Added job queue with concurrency control
- ✨ Added ZIP export functionality
- ✨ Added batch game generation
- ✨ Added smart fallback chain (Gemini → Claude → Templates)
- ✨ Added environment validation
- ✨ Added rate limiting
- ✨ Added queue management (pause/resume/concurrency)
- 🐛 Improved error handling
- 🐛 Enhanced security

### v1.0.0
- 🎉 Initial release
- Basic game generation
- Gemini and Claude API support
- Simple polling for updates

---

**Made with ❤️ by the GAMECHAMBER team**

For issues, questions, or feature requests, please open an issue on GitHub.
