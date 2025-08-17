import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "./config.js";

// Create the main logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "yafa-engine" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File transport with rotation
    new DailyRotateFile({
      filename: env.LOG_FILE,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

// Create a request-specific logger
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Export the main logger
export { logger };

// Log startup
logger.info("YAFA Engine logger initialized", { 
  environment: env.NODE_ENV, 
  port: env.PORT,
  features: {
    caching: env.ENABLE_CACHING,
    jobs: env.ENABLE_JOBS,
    auth: env.ENABLE_AUTH,
    metrics: env.ENABLE_METRICS,
  }
});
