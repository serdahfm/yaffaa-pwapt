// The definitive Cartridge interface and type definitions
import { z } from "zod";

// Core cartridge schema with comprehensive validation
export const cartridgeSchema = z.object({
  id: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()),
  author: z.string(),
  license: z.string(),
  compatibility: z.object({
    engine: z.string(),
    minVersion: z.string(),
    maxVersion: z.string().optional(),
  }),
  persona: z.object({
    name: z.string(),
    role: z.string(),
    voice: z.string(),
    expertise: z.array(z.string()),
    background: z.string(),
  }),
  requiredSlots: z.array(z.string()),
  optionalSlots: z.array(z.string()),
  slotQuestions: z.record(z.string(), z.string()),
  prompts: z.object({
    system: z.string(),
    user: z.string(),
    critic: z.string(),
    examples: z.array(z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string(),
    })),
  }),
  determinism: z.object({
    temperature: z.number().min(0).max(2),
    topP: z.number().min(0).max(1),
    seed: z.number().optional(),
    maxTokens: z.number().positive(),
    stopSequences: z.array(z.string()).optional(),
  }),
  quality: z.object({
    minClarity: z.number().min(1).max(10),
    minCompleteness: z.number().min(1).max(10),
    minDeterminism: z.number().min(1).max(10),
    minSafety: z.number().min(1).max(10),
  }),
  builder: z.object({
    schemaBrief: z.string(),
    validationRules: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  metadata: z.record(z.string(), z.any()),
});

export type Cartridge = z.infer<typeof cartridgeSchema>;

// Cartridge detection result
export interface DetectionResult {
  score: number;
  confidence: number;
  reasoning: string;
  matchedKeywords: string[];
}

// Compose result with structured output
export interface ComposeResult {
  system: string;
  user: string;
  critic: string;
  metadata: {
    cartridgeId: string;
    version: string;
    timestamp: string;
    slots: Record<string, any>;
  };
}

// Critique result with quality assessment
export interface CritiqueResult {
  scorecard: {
    clarity: number;
    completeness: number;
    determinism: number;
    safety: number;
    overall: number;
  };
  feedback: string[];
  suggestions: string[];
  stillMissing: string[];
  knobSuggestions: Array<{
    name: string;
    value: any;
    reason: string;
  }>;
}

// Cartridge registry for managing cartridges
export class CartridgeRegistry {
  private cartridges: Map<string, Cartridge> = new Map();

  register(cartridge: Cartridge): void {
    const validated = cartridgeSchema.parse(cartridge);
    this.cartridges.set(validated.id, validated);
  }

  get(id: string): Cartridge | undefined {
    return this.cartridges.get(id);
  }

  getAll(): Cartridge[] {
    return Array.from(this.cartridges.values());
  }

  remove(id: string): boolean {
    return this.cartridges.delete(id);
  }

  clear(): void {
    this.cartridges.clear();
  }

  size(): number {
    return this.cartridges.size;
  }

  has(id: string): boolean {
    return this.cartridges.has(id);
  }

  // Validate cartridge compatibility
  validateCompatibility(cartridge: Cartridge, engineVersion: string): boolean {
    const { minVersion, maxVersion } = cartridge.compatibility;
    
    if (maxVersion) {
      return engineVersion >= minVersion && engineVersion <= maxVersion;
    }
    
    return engineVersion >= minVersion;
  }

  // Get cartridges by keyword
  findByKeyword(keyword: string): Cartridge[] {
    return this.getAll().filter(c => 
      c.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
    );
  }

  // Get cartridges by author
  findByAuthor(author: string): Cartridge[] {
    return this.getAll().filter(c => 
      c.author.toLowerCase().includes(author.toLowerCase())
    );
  }
}

// Helper functions for cartridge operations
export function validateSlots(cartridge: Cartridge, slots: Record<string, any>): {
  valid: boolean;
  errors: string[];
  missing: string[];
} {
  const errors: string[] = [];
  const missing: string[] = [];

  // Check required slots
  for (const requiredSlot of cartridge.requiredSlots) {
    if (!(requiredSlot in slots) || slots[requiredSlot] === undefined || slots[requiredSlot] === "") {
      missing.push(requiredSlot);
      errors.push(`Required slot '${requiredSlot}' is missing`);
    }
  }

  // Validate slot types and values
  for (const [slotName, slotValue] of Object.entries(slots)) {
    if (slotValue === undefined || slotValue === null) {
      errors.push(`Slot '${slotName}' has invalid value`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    missing,
  };
}

export function keywordScore(cartridge: Cartridge, goal: string): number {
  const goalWords = goal.toLowerCase().split(/\s+/);
  let score = 0;

  for (const keyword of cartridge.keywords) {
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    
    for (const goalWord of goalWords) {
      for (const keywordWord of keywordWords) {
        if (goalWord.includes(keywordWord) || keywordWord.includes(goalWord)) {
          score += 1;
        }
      }
    }
  }

  return score;
}

export function calculateCompatibilityScore(cartridge: Cartridge, engineVersion: string): number {
  const { minVersion, maxVersion } = cartridge.compatibility;
  
  if (maxVersion) {
    if (engineVersion >= minVersion && engineVersion <= maxVersion) {
      return 1.0;
    }
    return 0.0;
  }
  
  if (engineVersion >= minVersion) {
    return 1.0;
  }
  
  return 0.0;
}
