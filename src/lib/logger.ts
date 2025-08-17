import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "./config.js";

// Create the main logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: "yafa-engine",
    version: "4.0.0",
    environment: config.server.environment,
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File transport for production
    ...(config.server.isProduction ? [
      new DailyRotateFile({
        filename: config.logging.file,
        datePattern: "YYYY-MM-DD",
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      }),
    ] : []),
  ],
});

// Create a request-specific logger
export function createRequestLogger(requestId: string) {
  return winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: "yafa-engine",
      requestId,
      version: "4.0.0",
      environment: config.server.environment,
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      
      ...(config.server.isProduction ? [
        new DailyRotateFile({
          filename: config.logging.file,
          datePattern: "YYYY-MM-DD",
          maxSize: config.logging.maxSize,
          maxFiles: config.logging.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ] : []),
    ],
  });
}

// Create a cartridge-specific logger
export function createCartridgeLogger(cartridgeId: string) {
  return winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: "yafa-engine",
      cartridgeId,
      version: "4.0.0",
      environment: config.server.environment,
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      
      ...(config.server.isProduction ? [
        new DailyRotateFile({
          filename: config.logging.file,
          datePattern: "YYYY-MM-DD",
          maxSize: config.logging.maxSize,
          maxFiles: config.logging.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ] : []),
    ],
  });
}

// Create a job-specific logger
export function createJobLogger(jobId: string) {
  return winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: "yafa-engine",
      jobId,
      version: "4.0.0",
      environment: config.server.environment,
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      
      ...(config.server.isProduction ? [
        new DailyRotateFile({
          filename: config.logging.file,
          datePattern: "YYYY-MM-DD",
          maxSize: config.logging.maxSize,
          maxFiles: config.logging.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ] : []),
    ],
  });
}

// Export the main logger
export { logger };

// Export logger levels for consistency
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Helper functions for structured logging
export function logError(message: string, meta?: any) {
  logger.error(message, meta);
}

export function logWarn(message: string, meta?: any) {
  logger.warn(message, meta);
}

export function logInfo(message: string, meta?: any) {
  logger.info(message, meta);
}

export function logDebug(message: string, meta?: any) {
  logger.debug(message, meta);
}

// Performance logging helpers
export function logPerformance(operation: string, duration: number, meta?: any) {
  logger.info(`${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...meta,
  });
}

export function logCacheHit(key: string, meta?: any) {
  logger.debug("Cache hit", { key, ...meta });
}

export function logCacheMiss(key: string, meta?: any) {
  logger.debug("Cache miss", { key, ...meta });
}

export function logJobStart(jobId: string, type: string, meta?: any) {
  logger.info("Job started", { jobId, type, ...meta });
}

export function logJobComplete(jobId: string, type: string, duration: number, meta?: any) {
  logger.info("Job completed", { jobId, type, duration, ...meta });
}

export function logJobError(jobId: string, type: string, error: Error, meta?: any) {
  logger.error("Job failed", { jobId, type, error: error.message, stack: error.stack, ...meta });
}

// Security logging helpers
export function logAuthSuccess(userId: string, method: string, meta?: any) {
  logger.info("Authentication successful", { userId, method, ...meta });
}

export function logAuthFailure(userId: string, method: string, reason: string, meta?: any) {
  logger.warn("Authentication failed", { userId, method, reason, ...meta });
}

export function logRateLimitExceeded(ip: string, endpoint: string, meta?: any) {
  logger.warn("Rate limit exceeded", { ip, endpoint, ...meta });
}

// API logging helpers
export function logApiRequest(method: string, path: string, requestId: string, meta?: any) {
  logger.info("API request", { method, path, requestId, ...meta });
}

export function logApiResponse(method: string, path: string, requestId: string, statusCode: number, duration: number, meta?: any) {
  logger.info("API response", { method, path, requestId, statusCode, duration, ...meta });
}

export function logApiError(method: string, path: string, requestId: string, error: Error, meta?: any) {
  logger.error("API error", { method, path, requestId, error: error.message, stack: error.stack, ...meta });
}
