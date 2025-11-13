import Joi from 'joi';
import dotenv from 'dotenv';

/**
 * Environment Configuration Validator
 * Validates required environment variables before server startup
 */

// Load environment variables
dotenv.config();

// Define the schema for environment variables
const envSchema = Joi.object({
  // Server Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .default(3001),

  // API Keys (at least one required)
  GEMINI_API_KEY: Joi.string()
    .optional()
    .allow(''),
  CLAUDE_API_KEY: Joi.string()
    .optional()
    .allow(''),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.required': 'JWT_SECRET is required for authentication'
    }),
  JWT_EXPIRES_IN: Joi.string()
    .default('7d'),

  // Admin Credentials
  ADMIN_USERNAME: Joi.string()
    .default('admin'),
  ADMIN_PASSWORD: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'ADMIN_PASSWORD must be at least 8 characters long',
      'any.required': 'ADMIN_PASSWORD is required'
    }),

  // Queue Configuration
  MAX_CONCURRENT_JOBS: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(3),
  JOB_TIMEOUT: Joi.number()
    .integer()
    .min(60000)
    .default(600000), // 10 minutes default

  // WebSocket Configuration
  WS_CORS_ORIGIN: Joi.string()
    .default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .default(100)
}).custom((value, helpers) => {
  // Custom validation: At least one API key must be provided
  if (!value.GEMINI_API_KEY && !value.CLAUDE_API_KEY) {
    return helpers.error('custom.noApiKeys');
  }
  return value;
}).messages({
  'custom.noApiKeys': 'At least one API key (GEMINI_API_KEY or CLAUDE_API_KEY) must be provided'
});

/**
 * Validate environment variables
 * @returns {Object} Validated and sanitized environment config
 * @throws {Error} If validation fails
 */
export function validateEnv() {
  const { error, value: validatedEnv } = envSchema.validate(process.env, {
    abortEarly: false, // Collect all errors
    stripUnknown: true, // Remove unknown env vars
    convert: true // Convert types
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    throw new Error(
      `Environment validation failed:\n${errorMessages.join('\n')}`
    );
  }

  return validatedEnv;
}

/**
 * Get validated environment configuration
 */
export function getConfig() {
  try {
    return validateEnv();
  } catch (error) {
    console.error('❌ Environment Configuration Error:');
    console.error(error.message);
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    console.error('💡 See .env.example for reference.\n');
    process.exit(1);
  }
}

/**
 * Display configuration summary (without sensitive data)
 */
export function displayConfigSummary(config) {
  console.log('\n✅ Environment Configuration Validated:');
  console.log('─────────────────────────────────────');
  console.log(`📦 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 Port: ${config.PORT}`);
  console.log(`🔑 Gemini API: ${config.GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`🔑 Claude API: ${config.CLAUDE_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`🔐 JWT Secret: ${config.JWT_SECRET ? '✓ Configured' : '✗ Missing'}`);
  console.log(`👤 Admin User: ${config.ADMIN_USERNAME}`);
  console.log(`⚙️  Max Concurrent Jobs: ${config.MAX_CONCURRENT_JOBS}`);
  console.log(`⏱️  Job Timeout: ${config.JOB_TIMEOUT}ms`);
  console.log('─────────────────────────────────────\n');
}

export default {
  validateEnv,
  getConfig,
  displayConfigSummary
};
