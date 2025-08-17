import { z } from "zod";

// Enhanced cartridge schema with versioning, compatibility, and detailed metadata
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

export type Cartridge = z.infer<typeof cartridgeSchema> & {
  detect(goal: string): DetectResult;
  compose(args: ComposeArgs): Promise<ComposeResult>;
  critique(args: CritiqueArgs): Promise<CritiqueResult>;
  assessClarity(draft: ComposeResult): number;
  assessCompleteness(draft: ComposeResult): number;
  assessDeterminism(draft: ComposeResult): number;
  assessSafety(draft: ComposeResult): number;
  assessBuilder(draft: ComposeResult): number;
  assessAlternatives(draft: ComposeResult): number;
};

export interface DetectResult {
  score: number;
  deliverable: string;
}

export interface ComposeArgs {
  goal: string;
  slots: Record<string, any>;
  yafaOn: boolean;
  requestId: string;
  userId?: string;
}

export interface ComposeResult {
  system: string;
  user: string;
  outputContract: {
    jsonOnly: boolean;
    sentinel: string;
    alternativesRequired: boolean;
    schemaRef: string;
  };
  determinism: {
    temperature: number;
    topP: number;
    seed?: number;
    stop: string[];
    maxTokens: number;
  };
  builderPlanHint?: string;
  metadata: {
    cartridgeId: string;
    cartridgeVersion: string;
    compileTime: number;
    provider: string;
    model: string;
    cost: number;
    requestId: string;
  };
}

export interface CritiqueArgs {
  draft: ComposeResult;
  packId: string;
  requestId: string;
}

export interface CritiqueResult {
  scorecard: {
    clarity: number;
    completeness: number;
    determinism: number;
    safety: number;
    builder: number;
    alternatives: number;
    knobs: number;
  };
  edits: Array<{
    type: "replace" | "add" | "remove";
    target: "system" | "user";
    with?: string;
    reason: string;
  }>;
  knobSuggestions: Array<{
    name: string;
    value: any;
    reason: string;
  }>;
  stillMissing: string[];
  quality: "poor" | "fair" | "good" | "excellent";
  recommendations: string[];
}

export interface Registry {
  register(cartridge: Cartridge): void;
  get(id: string): Cartridge | undefined;
  getAll(): Cartridge[];
  detect(goal: string): DetectResult[];
}

export class CartridgeRegistry implements Registry {
  private cartridges: Map<string, Cartridge> = new Map();

  register(cartridge: Cartridge): void {
    this.cartridges.set(cartridge.id, cartridge);
  }

  get(id: string): Cartridge | undefined {
    return this.cartridges.get(id);
  }

  getAll(): Cartridge[] {
    return Array.from(this.cartridges.values());
  }

  detect(goal: string): DetectResult[] {
    const results: DetectResult[] = [];
    
    for (const cartridge of this.cartridges.values()) {
      const score = keywordScore(goal, cartridge.keywords);
      if (score > 0.3) {
        results.push({
          score,
          deliverable: cartridge.id,
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
}

// Helper functions
export function keywordScore(goal: string, keywords: string[]): number {
  const goalLower = goal.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    if (goalLower.includes(keyword.toLowerCase())) {
      score += 1;
    }
  }
  
  return score / keywords.length;
}

export function validateSlots(cartridge: Cartridge, slots: Record<string, any>): { 
  valid: boolean; 
  missing: string[]; 
  errors: Record<string, string> 
} {
  const missing: string[] = [];
  const errors: Record<string, string> = {};
  
  for (const slot of cartridge.requiredSlots) {
    if (!slots[slot] || !String(slots[slot]).trim()) {
      missing.push(slot);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}
