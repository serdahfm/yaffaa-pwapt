import { z } from "zod";

// Enhanced compile input schema
export const compileInputSchema = z.object({
  goal: z.string().min(1),
  yafaOn: z.boolean(),
  slots: z.record(z.string(), z.any()).optional(),
  requestId: z.string().uuid(),
  userId: z.string().optional(),
  bypassCache: z.boolean().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  seed: z.number().optional(),
  timeout: z.number().optional(),
});

// Enhanced compile output schema
export const compileOutputSchema = z.object({
  status: z.enum(["OK", "NEEDED", "ERROR"]),
  packId: z.string(),
  final: z.object({
    system: z.string(),
    user: z.string(),
    outputContract: z.object({
      jsonOnly: z.boolean(),
      sentinel: z.string(),
      alternativesRequired: z.boolean(),
      schemaRef: z.string(),
    }),
    determinism: z.object({
      temperature: z.number(),
      topP: z.number(),
      seed: z.number().optional(),
      stop: z.array(z.string()),
      maxTokens: z.number(),
    }),
    builderPlanHint: z.string().optional(),
    metadata: z.object({
      cartridgeId: z.string(),
      cartridgeVersion: z.string(),
      compileTime: z.number(),
      provider: z.string(),
      model: z.string(),
      cost: z.number(),
      requestId: z.string(),
    }),
  }).optional(),
  questions: z.array(z.string()).optional(),
  knobs: z.array(z.object({
    name: z.string(),
    value: z.any(),
    reason: z.string(),
  })).optional(),
  scorecard: z.object({
    clarity: z.number(),
    completeness: z.number(),
    determinism: z.number(),
    safety: z.number(),
    builder: z.number(),
    alternatives: z.number(),
    knobs: z.number(),
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

// SABI input schema
export const sabiInputSchema = z.object({
  originalPrompt: z.string(),
  llmResponse: z.string(),
  userNeeds: z.string(),
  requestId: z.string().uuid(),
});

// SABI output schema
export const sabiOutputSchema = z.object({
  improvedPrompt: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  requestId: z.string(),
});

// Compose result schema
export const composeResultSchema = z.object({
  system: z.string(),
  user: z.string(),
  outputContract: z.object({
    jsonOnly: z.boolean(),
    sentinel: z.string(),
    alternativesRequired: z.boolean(),
    schemaRef: z.string(),
  }),
  determinism: z.object({
    temperature: z.number(),
    topP: z.number(),
    seed: z.number().optional(),
    stop: z.array(z.string()),
    maxTokens: z.number(),
  }),
  builderPlanHint: z.string().optional(),
  metadata: z.object({
    cartridgeId: z.string(),
    cartridgeVersion: z.string(),
    compileTime: z.number(),
    provider: z.string(),
    model: z.string(),
    cost: z.number(),
    requestId: z.string(),
  }),
});

// Scorecard schema
export const scorecardSchema = z.object({
  clarity: z.number().min(0).max(10),
  completeness: z.number().min(0).max(10),
  determinism: z.number().min(0).max(10),
  safety: z.number().min(0).max(10),
  builder: z.number().min(0).max(10),
  alternatives: z.number().min(0).max(10),
  knobs: z.number().min(0).max(10),
});

// Critique result schema
export const critiqueResultSchema = z.object({
  scorecard: scorecardSchema,
  edits: z.array(z.object({
    type: z.enum(["replace", "add", "remove"]),
    target: z.enum(["system", "user"]),
    with: z.string().optional(),
    reason: z.string(),
  })),
  knobSuggestions: z.array(z.object({
    name: z.string(),
    value: z.any(),
    reason: z.string(),
  })),
  stillMissing: z.array(z.string()),
  quality: z.enum(["poor", "fair", "good", "excellent"]),
  recommendations: z.array(z.string()),
});

// Cartridge schema (for API responses)
export const cartridgeSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  author: z.string(),
  license: z.string(),
  compatibility: z.object({
    engineMin: z.string(),
    features: z.array(z.string()),
  }),
  persona: z.object({
    name: z.string(),
    role: z.string(),
    traits: z.array(z.string()),
    voice: z.string(),
    expertise: z.array(z.string()),
  }),
  requiredSlots: z.array(z.string()),
  optionalSlots: z.array(z.string()),
  slotQuestions: z.record(z.string()),
  slotValidation: z.record(z.object({
    type: z.string(),
    required: z.boolean(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    enum: z.array(z.string()).optional(),
  })),
  builder: z.object({
    type: z.string(),
    schemaBrief: z.string(),
    outputFormat: z.string(),
    dependencies: z.array(z.string()),
  }),
  prompts: z.object({
    system: z.string(),
    user: z.string(),
    critic: z.string(),
    examples: z.array(z.string()),
  }),
  determinism: z.object({
    temperature: z.number(),
    topP: z.number(),
    seed: z.number().optional(),
    stop: z.array(z.string()),
    maxTokens: z.number(),
  }),
  quality: z.object({
    minClarity: z.number(),
    minCompleteness: z.number(),
    minDeterminism: z.number(),
    minSafety: z.number(),
  }),
  metadata: z.object({
    tags: z.array(z.string()),
    category: z.string(),
    difficulty: z.string(),
    estimatedTime: z.number(),
  }),
});
