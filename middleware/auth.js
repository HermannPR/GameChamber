import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

/**
 * Verify JWT token from request
 */
export function authenticateToken(req, res, next) {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'No token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
}

/**
 * Optional authentication - adds user if token exists but doesn't require it
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid but we continue anyway
      req.user = null;
    }
  }

  next();
}

/**
 * Check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
}

/**
 * Generate JWT token
 */
export function generateToken(payload, expiresIn = null) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Hash password
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
const requestCounts = new Map();

export function rateLimiter(windowMs, maxRequests) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Clean up old entries
    for (const [key, value] of requestCounts.entries()) {
      if (now - value.resetTime > windowMs) {
        requestCounts.delete(key);
      }
    }

    // Get or create request count for this IP
    let requestData = requestCounts.get(identifier);

    if (!requestData) {
      requestData = {
        count: 0,
        resetTime: now
      };
      requestCounts.set(identifier, requestData);
    }

    // Check if window has expired
    if (now - requestData.resetTime > windowMs) {
      requestData.count = 0;
      requestData.resetTime = now;
    }

    // Increment count
    requestData.count++;

    // Check limit
    if (requestData.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - requestData.resetTime)) / 1000)
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - requestData.count);
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + windowMs).toISOString());

    next();
  };
}

export default {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  generateToken,
  hashPassword,
  comparePassword,
  rateLimiter
};
