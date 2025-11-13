import { generateToken, hashPassword, comparePassword } from '../middleware/auth.js';

/**
 * Authentication Controller
 * Handles user login and token generation
 */

// In-memory user store (in production, use a database)
const users = new Map();

/**
 * Initialize default admin user
 */
export function initializeDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  // Hash password and store admin user
  hashPassword(adminPassword).then(hashedPassword => {
    users.set(adminUsername, {
      username: adminUsername,
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date().toISOString()
    });

    console.log(`👤 Admin user initialized: ${adminUsername}`);
  });
}

/**
 * POST /api/auth/login
 * Login endpoint
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = users.get(username);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken({
      username: user.username,
      isAdmin: user.isAdmin
    });

    // Return token and user info
    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        isAdmin: user.isAdmin
      },
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
}

/**
 * POST /api/auth/verify
 * Verify token endpoint
 */
export function verifyToken(req, res) {
  // If middleware passed, token is valid
  res.json({
    success: true,
    user: req.user
  });
}

/**
 * POST /api/auth/refresh
 * Refresh token endpoint
 */
export function refreshToken(req, res) {
  try {
    // Generate new token with same payload
    const newToken = generateToken({
      username: req.user.username,
      isAdmin: req.user.isAdmin
    });

    res.json({
      success: true,
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: {
      username: req.user.username,
      isAdmin: req.user.isAdmin
    }
  });
}

export default {
  login,
  verifyToken,
  refreshToken,
  getCurrentUser,
  initializeDefaultAdmin
};
