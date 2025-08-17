import { z } from "zod";

// Environment variable schema with comprehensive validation
const configSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  HOST: z.string().default("localhost"),
  PORT: z.coerce.number().min(1).max(65535).default(3001),
  
  // Security configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("24h"),
  API_KEY_SALT_ROUNDS: z.coerce.number().min(10).max(20).default(12),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.coerce.number().min(1000).default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().min(1).default(100),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.coerce.boolean().default(false),
  
  // CORS configuration
  CORS_ORIGIN: z.string().default("*"),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),
  
  // Body size limits
  MAX_BODY_SIZE: z.string().default("10mb"),
  
  // Redis configuration
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).max(15).default(0),
  
  // LLM Provider configuration
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_ORG_ID: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_MAX_TOKENS: z.coerce.number().min(1).max(4000).default(1000),
  OPENAI_TIMEOUT: z.coerce.number().min(1000).default(30000),
  
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-haiku-20240307"),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().min(1).max(4000).default(1000),
  ANTHROPIC_TIMEOUT: z.coerce.number().min(1000).default(30000),
  
  // Cache configuration
  CACHE_TTL: z.coerce.number().min(1000).default(3600000), // 1 hour
  CACHE_MAX_SIZE: z.coerce.number().min(100).default(1000),
  
  // Job queue configuration
  QUEUE_CONCURRENCY: z.coerce.number().min(1).default(5),
  QUEUE_MAX_JOBS: z.coerce.number().min(100).default(1000),
  
  // Logging configuration
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE: z.string().default("logs/app.log"),
  LOG_MAX_SIZE: z.string().default("20m"),
  LOG_MAX_FILES: z.coerce.number().min(1).default(14),
  
  // Metrics configuration
  ENABLE_METRICS: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().min(1).max(65535).default(9090),
  
  // Swagger configuration
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
  SWAGGER_TITLE: z.string().default("YAFA Prompt Orchestration Engine API"),
  SWAGGER_VERSION: z.string().default("4.0.0"),
  
  // File storage configuration
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.coerce.number().min(1024).default(10 * 1024 * 1024), // 10MB
  
  // Git configuration for provenance
  GIT_COMMIT_HASH: z.string().optional(),
  GIT_BRANCH: z.string().optional(),
  GIT_REMOTE_URL: z.string().optional(),
});

// Parse and validate environment variables
export const env = configSchema.parse(process.env);

// Configuration object with computed values
export const config = {
  server: {
    host: env.HOST,
    port: env.PORT,
    environment: env.NODE_ENV,
    isProduction: env.NODE_ENV === "production",
    isDevelopment: env.NODE_ENV === "development",
  },
  
  security: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    apiKeySaltRounds: env.API_KEY_SALT_ROUNDS,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW,
    max: env.RATE_LIMIT_MAX,
    skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  },
  
  cors: {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: env.CORS_CREDENTIALS,
  },
  
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },
  
  llm: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      orgId: env.OPENAI_ORG_ID,
      model: env.OPENAI_MODEL,
      maxTokens: env.OPENAI_MAX_TOKENS,
      timeout: env.OPENAI_TIMEOUT,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
      maxTokens: env.ANTHROPIC_MAX_TOKENS,
      timeout: env.ANTHROPIC_TIMEOUT,
    },
  },
  
  cache: {
    ttl: env.CACHE_TTL,
    maxSize: env.CACHE_MAX_SIZE,
  },
  
  queue: {
    concurrency: env.QUEUE_CONCURRENCY,
    maxJobs: env.QUEUE_MAX_JOBS,
  },
  
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
  },
  
  metrics: {
    enabled: env.ENABLE_METRICS,
    port: env.METRICS_PORT,
  },
  
  swagger: {
    enabled: env.ENABLE_SWAGGER,
    title: env.SWAGGER_TITLE,
    version: env.SWAGGER_VERSION,
  },
  
  storage: {
    uploadDir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
  },
  
  git: {
    commitHash: env.GIT_COMMIT_HASH,
    branch: env.GIT_BRANCH,
    remoteUrl: env.GIT_REMOTE_URL,
  },
} as const;

// Type for the config object
export type Config = typeof config;

// Helper function to get configuration value
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key];
}

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof Config): boolean {
  const value = config[feature];
  if (typeof value === "object" && value !== null && "enabled" in value) {
    return (value as any).enabled;
  }
  return true;
}
