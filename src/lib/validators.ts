// Zod schemas for validation
import { z } from "zod";

// Compile input validation
export const compileInputSchema = z.object({
  goal: z.string().min(1).max(10000),
  yafaOn: z.boolean().default(false),
  slots: z.record(z.string(), z.any()).default({}),
  requestId: z.string().uuid(),
  userId: z.string().optional(),
  bypassCache: z.boolean().default(false),
  provider: z.enum(["openai", "anthropic", "local"]).optional(),
  model: z.string().optional(),
  seed: z.number().optional(),
  timeout: z.number().min(1000).max(300000).optional(),
});

export type CompileInput = z.infer<typeof compileInputSchema>;

// Compile output validation
export const compileOutputSchema = z.object({
  status: z.enum(["OK", "NEEDED", "ERROR"]),
  packId: z.string(),
  final: z.object({
    system: z.string(),
    user: z.string(),
    critic: z.string(),
    determinism: z.object({
      temperature: z.number().min(0).max(2),
      topP: z.number().min(0).max(1),
      seed: z.number().optional(),
      maxTokens: z.number().positive(),
    }),
  }).optional(),
  questions: z.array(z.string()).optional(),
  knobs: z.array(z.object({
    name: z.string(),
    value: z.any(),
    reason: z.string(),
  })).optional(),
  scorecard: z.object({
    clarity: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    determinism: z.number().min(1).max(10),
    safety: z.number().min(1).max(10),
    overall: z.number().min(1).max(10),
  }).optional(),
  metadata: z.object({
    requestId: z.string(),
    compileTime: z.number(),
    cartridgeId: z.string(),
    cartridgeVersion: z.string(),
    provider: z.string(),
    model: z.string(),
    cost: z.number(),
    cacheHit: z.boolean(),
    provenance: z.object({
      commitHash: z.string(),
      timestamp: z.string(),
      runId: z.string(),
      engineVersion: z.string(),
      cartridgeChecksum: z.string(),
    }),
  }),
});

export type CompileOutput = z.infer<typeof compileOutputSchema>;

// Run manifest validation
export const runManifestSchema = z.object({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
  userId: z.string().optional(),
  timestamp: z.string(),
  input: compileInputSchema,
  output: compileOutputSchema,
  cartridge: z.object({
    id: z.string(),
    version: z.string(),
    checksum: z.string(),
  }),
  provider: z.object({
    name: z.string(),
    model: z.string(),
    parameters: z.object({
      temperature: z.number(),
      topP: z.number(),
      seed: z.number().optional(),
      maxTokens: z.number(),
    }),
  }),
  performance: z.object({
    compileTime: z.number(),
    totalTime: z.number(),
    cacheHit: z.boolean(),
  }),
  cost: z.object({
    amount: z.number(),
    currency: z.string(),
    tokens: z.object({
      input: z.number(),
      output: z.number(),
      total: z.number(),
    }),
  }),
});

export type RunManifest = z.infer<typeof runManifestSchema>;

// Job data validation
export const jobDataSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["compile", "critique", "export"]),
  data: z.any(),
  metadata: z.record(z.string(), z.any()),
  priority: z.number().min(1).max(10).default(5),
  delay: z.number().min(0).default(0),
  attempts: z.number().min(1).max(10).default(3),
});

export type JobData = z.infer<typeof jobDataSchema>;

// Job result validation
export const jobResultSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  error: z.string().optional(),
  metadata: z.object({
    jobId: z.string(),
    duration: z.number(),
    timestamp: z.number(),
  }),
});

export type JobResult = z.infer<typeof jobResultSchema>;

// Job status validation
export const jobStatusSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]),
  progress: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  result: jobResultSchema.optional(),
  error: z.string().optional(),
  attempts: z.number().min(0),
  maxAttempts: z.number().min(1),
});

export type JobStatus = z.infer<typeof jobStatusSchema>;

// User validation
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  role: z.enum(["user", "admin", "operator"]).default("user"),
  permissions: z.array(z.string()).default([]),
  quota: z.object({
    dailyRequests: z.number().min(0).default(1000),
    monthlyRequests: z.number().min(0).default(30000),
    maxConcurrentJobs: z.number().min(1).default(5),
  }),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActiveAt: z.date().optional(),
});

export type User = z.infer<typeof userSchema>;

// API key validation
export const apiKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  key: z.string().min(32).max(64),
  permissions: z.array(z.string()).default([]),
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).default(60),
    requestsPerHour: z.number().min(1).default(1000),
    requestsPerDay: z.number().min(1).default(10000),
  }),
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  lastUsedAt: z.date().optional(),
});

export type APIKey = z.infer<typeof apiKeySchema>;

// Authentication context validation
export const authContextSchema = z.object({
  userId: z.string().uuid(),
  user: userSchema,
  apiKey: apiKeySchema.optional(),
  permissions: z.array(z.string()),
  rateLimit: z.object({
    remaining: z.number().min(0),
    resetTime: z.date(),
  }),
});

export type AuthContext = z.infer<typeof authContextSchema>;

// Cartridge registration validation
export const cartridgeRegistrationSchema = z.object({
  cartridge: z.any(), // This will be validated by cartridgeSchema
  force: z.boolean().default(false),
  validateCompatibility: z.boolean().default(true),
});

export type CartridgeRegistration = z.infer<typeof cartridgeRegistrationSchema>;

// Export request validation
export const exportRequestSchema = z.object({
  format: z.enum(["json", "csv", "zip"]).default("json"),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    cartridgeId: z.string().optional(),
    userId: z.string().optional(),
    status: z.enum(["OK", "NEEDED", "ERROR"]).optional(),
  }).optional(),
  includeMetadata: z.boolean().default(true),
  includeInputs: z.boolean().default(true),
  includeOutputs: z.boolean().default(true),
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;

// SABI loop validation
export const sabiInputSchema = z.object({
  originalPrompt: z.string().min(1).max(10000),
  llmResponse: z.string().min(1).max(50000),
  userNeeds: z.string().min(1).max(5000),
  context: z.record(z.string(), z.any()).optional(),
  constraints: z.array(z.string()).optional(),
});

export type SabiInput = z.infer<typeof sabiInputSchema>;

// Cache key validation
export const cacheKeySchema = z.object({
  goal: z.string(),
  slots: z.record(z.string(), z.any()),
  yafaOn: z.boolean(),
  cartridgeId: z.string(),
  cartridgeVersion: z.string(),
});

export type CacheKey = z.infer<typeof cacheKeySchema>;

// Cache options validation
export const cacheOptionsSchema = z.object({
  ttl: z.number().min(1000).default(3600000), // 1 hour
  tags: z.array(z.string()).optional(),
  priority: z.number().min(1).max(10).default(5),
});

export type CacheOptions = z.infer<typeof cacheOptionsSchema>;

// Provider configuration validation
export const providerConfigSchema = z.object({
  name: z.enum(["openai", "anthropic", "local"]),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseURL: z.string().url().optional(),
  timeout: z.number().min(1000).default(30000),
  maxRetries: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).default(1000),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;

// Generation request validation
export const generationRequestSchema = z.object({
  system: z.string(),
  user: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  maxTokens: z.number().min(1).max(4000).default(1000),
  seed: z.number().optional(),
  stop: z.array(z.string()).optional(),
  stream: z.boolean().default(false),
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;

// Generation response validation
export const generationResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
  cost: z.number(),
  finishReason: z.string(),
  metadata: z.record(z.string(), z.any()),
});

export type GenerationResponse = z.infer<typeof generationResponseSchema>;

// Validation helper functions
export function validateCompileInput(input: unknown): CompileInput {
  return compileInputSchema.parse(input);
}

export function validateCompileOutput(output: unknown): CompileOutput {
  return compileOutputSchema.parse(output);
}

export function validateRunManifest(manifest: unknown): RunManifest {
  return runManifestSchema.parse(manifest);
}

export function validateJobData(data: unknown): JobData {
  return jobDataSchema.parse(data);
}

export function validateUser(user: unknown): User {
  return userSchema.parse(user);
}

export function validateAPIKey(apiKey: unknown): APIKey {
  return apiKeySchema.parse(apiKey);
}

export function validateAuthContext(context: unknown): AuthContext {
  return authContextSchema.parse(context);
}

export function validateGenerationRequest(request: unknown): GenerationRequest {
  return generationRequestSchema.parse(request);
}

export function validateGenerationResponse(response: unknown): GenerationResponse {
  return generationResponseSchema.parse(response);
}

export function validateSabiInput(input: unknown): SabiInput {
  return sabiInputSchema.parse(input);
}
