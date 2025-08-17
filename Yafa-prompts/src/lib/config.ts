import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Comprehensive configuration schema
const configSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("3000"),
  HOST: z.string().default("localhost"),
  
  // Security configuration
  JWT_SECRET: z.string().min(32),
  API_KEY_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("*"),
  MAX_BODY_SIZE: z.string().transform(Number).default("10485760"), // 10MB
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.string().transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default("100"),
  
  // LLM Provider configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEFAULT_PROVIDER: z.enum(["openai", "anthropic", "local"]).default("openai"),
  DEFAULT_MODEL: z.string().default("gpt-4o-mini"),
  
  // Redis configuration
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default("0"),
  
  // Queue configuration
  QUEUE_CONCURRENCY: z.string().transform(Number).default("5"),
  QUEUE_RETRY_ATTEMPTS: z.string().transform(Number).default("3"),
  
  // Database configuration
  DATABASE_URL: z.string().optional(),
  DATABASE_TYPE: z.enum(["sqlite", "postgresql", "mysql"]).default("sqlite"),
  
  // Observability
  ENABLE_METRICS: z.string().transform(val => val === "true").default("true"),
  ENABLE_SWAGGER: z.string().transform(val => val === "true").default("true"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE: z.string().default("logs/app.log"),
  
  // Storage configuration
  DATA_DIR: z.string().default("data"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.string().transform(Number).default("52428800"), // 50MB
  
  // Feature flags
  ENABLE_CACHING: z.string().transform(val => val === "true").default("true"),
  ENABLE_JOBS: z.string().transform(val => val === "true").default("true"),
  ENABLE_AUTH: z.string().transform(val => val === "true").default("true"),
  
  // Limits
  MAX_COMPILATION_TIME: z.string().transform(Number).default("300000"), // 5 minutes
  MAX_TOKENS_PER_REQUEST: z.string().transform(Number).default("10000"),
  MAX_REQUESTS_PER_MINUTE: z.string().transform(Number).default("60"),
  
  // Git commit hash for provenance (optional)
  GIT_COMMIT_HASH: z.string().optional(),
});

// Parse and validate environment variables
const env = configSchema.parse(process.env);

// Helper exports
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

export { env };
