import { z } from "zod";
import { DomainPack, detectDomainPack, getMissingSlots, getQuestionsFor } from "@yafa/domain-packs";

// 🚀 PROMPT CONTRACT SCHEMA (Zod)
export const PromptContract = z.object({
  meta: z.object({
    mode: z.enum(["yaffa", "discovery"]),
    locale: z.string().default("en-US"),
    budget_tokens: z.number().int().default(4000),
    pack_id: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
  }),
  objective: z.object({
    task: z.string(),
    goal: z.string(),
    audience: z.string().optional(),
    success_criteria: z.array(z.string()).default([]),
  }),
  constraints: z.object({
    timeframe: z.string().optional(),
    tone: z.string().optional(),
    length: z.string().optional(),
    complexity: z.string().optional(),
    safety: z.array(z.string()).optional(),
    non_goals: z.array(z.string()).optional(),
  }).default({}),
  grounding: z.object({
    glossary: z.array(z.string()).default([]),
    snippets: z.array(z.object({
      id: z.string(),
      text: z.string()
    })).default([]),
    citations_required: z.boolean().default(false),
  }).default({}),
  exemplars: z.array(z.record(z.any())).default([]),
  output_contract: z.object({
    format: z.enum(["json", "markdown", "function"]),
    schema_ref: z.string().optional(),
  }),
  determinism: z.object({
    temperature: z.number().min(0).max(1),
    top_p: z.number().min(0).max(1).default(1),
    seed: z.number().int().optional(),
    stop: z.array(z.string()).optional(),
  }),
  self_checks: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  repair_policy: z.object({
    max_retries: z.number().int().default(1),
    on_fail: z.string().default("tighten_schema")
  }).default({}),
});

export type PromptContract = z.infer<typeof PromptContract>;

// 🚀 EVALUATION RESULT SCHEMA
export const EvaluationResult = z.object({
  scorecard: z.object({
    clarity: z.number().min(0).max(5),
    completeness: z.number().min(0).max(5),
    determinism: z.number().min(0).max(5),
    safety: z.number().min(0).max(5),
    builder: z.number().min(0).max(5),
    alternatives: z.number().min(0).max(5),
    knobs: z.number().min(0).max(5),
  }),
  edits: z.array(z.object({
    type: z.enum(["replace", "add", "remove", "tighten"]),
    target: z.string(),
    with: z.string().optional(),
    reason: z.string(),
  })),
  missing_slots: z.array(z.string()),
  knob_suggestions: z.array(z.object({
    key: z.string(),
    ask: z.string(),
    current_value: z.string().optional(),
  })),
  overall_score: z.number().min(0).max(5),
  needs_improvement: z.boolean(),
  critical_issues: z.array(z.string()),
});

export type EvaluationResult = z.infer<typeof EvaluationResult>;

// 🚀 FINAL PROMPT SCHEMA
export const FinalPrompt = z.object({
  status: z.enum(["OK", "NEEDED"]),
  prompt_text: z.string(),
  alternatives: z.array(z.object({
    title: z.string(),
    rationale: z.string(),
    prompt_text: z.string(),
  })).min(2).max(3),
  builder_plan: z.any().optional(),
  copy_instruction: z.string().optional(),
  metadata: z.object({
    pack_id: z.string(),
    confidence: z.number(),
    generation_time: z.number(),
    optimization_level: z.string(),
  }),
});

export type FinalPrompt = z.infer<typeof FinalPrompt>;

// 🚀 CORE COMPILER CLASS
export class YAFFACompiler {
  private domainPack: DomainPack | null = null;
  private mode: "yaffa" | "discovery" = "yaffa";

  constructor() {
    console.log("🚀 YAFFA Compiler initialized - Ready for DOMAIN EMPIRE!");
  }

  // 🎯 PHASE 1: COMPILE - Detect domain and build base contract
  async compile(userGoal: string, mode: "yaffa" | "discovery" = "yaffa"): Promise<PromptContract> {
    console.log(`🎯 Compiling prompt for: "${userGoal}" in ${mode.toUpperCase()} mode`);
    
    // Step 1: Domain Detection
    const detection = detectDomainPack(userGoal);
    this.domainPack = detection.pack;
    this.mode = mode;

    if (!this.domainPack) {
      throw new Error("❌ No domain pack detected. Please provide more specific details about your goal.");
    }

    console.log(`✅ Domain detected: ${this.domainPack.title} (confidence: ${(detection.confidence * 100).toFixed(1)}%)`);

    // Step 2: Build base contract from domain pack
    const contract: PromptContract = {
      meta: {
        mode,
        locale: "en-US",
        budget_tokens: 4000,
        pack_id: this.domainPack.id,
        confidence: detection.confidence,
      },
      objective: {
        task: "create",
        goal: userGoal,
        audience: "general",
        success_criteria: [],
      },
      constraints: {
        tone: this.domainPack.constraints_defaults.tone || "professional",
        length: this.domainPack.constraints_defaults.length || "detailed",
        complexity: this.domainPack.constraints_defaults.complexity || "moderate",
      },
      grounding: {
        glossary: [],
        snippets: [],
        citations_required: mode === "yaffa",
      },
      exemplars: [],
      output_contract: {
        format: "json",
        schema_ref: `yafa://schemas/${this.domainPack.id}_v1`,
      },
      determinism: {
        temperature: mode === "yaffa" ? 0.2 : 0.8,
        top_p: 1,
        seed: mode === "yaffa" ? 7 : undefined,
        stop: mode === "yaffa" ? ["<END_JSON>"] : undefined,
      },
      self_checks: mode === "yaffa" ? ["contract_valid", "schema_compliant"] : [],
      assumptions: [],
      repair_policy: {
        max_retries: mode === "yaffa" ? 2 : 1,
        on_fail: mode === "yaffa" ? "tighten_schema" : "regenerate",
      },
    };

    console.log(`✅ Base contract compiled with ${this.domainPack.required_slots.length} required slots`);
    return contract;
  }

  // 🎯 PHASE 2: EVALUATE - Score the contract and identify improvements
  async evaluate(contract: PromptContract): Promise<EvaluationResult> {
    if (!this.domainPack) {
      throw new Error("❌ No domain pack available for evaluation");
    }

    console.log(`🔍 Evaluating contract for ${this.domainPack.title}`);

    // Calculate scores based on domain pack rubric weights
    const scores = {
      clarity: this.calculateClarityScore(contract),
      completeness: this.calculateCompletenessScore(contract),
      determinism: this.calculateDeterminismScore(contract),
      safety: this.calculateSafetyScore(contract),
      builder: this.calculateBuilderScore(contract),
      alternatives: this.calculateAlternativesScore(contract),
      knobs: this.calculateKnobsScore(contract),
    };

    const overall_score = Object.values(scores).reduce((a, b) => a + b, 0) / 7;

    // Identify missing slots
    const missing_slots = getMissingSlots(this.domainPack, contract.constraints as any);
    
    // Generate improvement suggestions
    const edits = this.generateEdits(contract, scores);
    const knob_suggestions = this.generateKnobSuggestions(contract, missing_slots);

    const result: EvaluationResult = {
      scorecard: scores,
      edits,
      missing_slots,
      knob_suggestions,
      overall_score,
      needs_improvement: overall_score < 4.0 || missing_slots.length > 0,
      critical_issues: this.identifyCriticalIssues(contract, scores),
    };

    console.log(`✅ Evaluation complete - Overall score: ${overall_score.toFixed(1)}/5.0`);
    return result;
  }

  // 🎯 PHASE 3: PATCH - Apply improvements and generate final prompt
  async patch(contract: PromptContract, evaluation: EvaluationResult): Promise<FinalPrompt> {
    console.log(`🔧 Patching contract with ${evaluation.edits.length} improvements`);

    // Check if we need more information
    if (evaluation.missing_slots.length > 0) {
      return {
        status: "NEEDED",
        prompt_text: "",
        alternatives: [],
        metadata: {
          pack_id: this.domainPack!.id,
          confidence: contract.meta.confidence || 0,
          generation_time: Date.now(),
          optimization_level: "incomplete",
        },
      };
    }

    // Apply edits to improve the contract
    const improvedContract = this.applyEdits(contract, evaluation.edits);
    
    // Generate the final prompt text
    const promptText = this.generateFinalPromptText(improvedContract);
    
    // Generate alternatives
    const alternatives = this.generateAlternatives(improvedContract);
    
    // Generate builder plan if applicable
    const builderPlan = this.domainPack?.builder ? this.generateBuilderPlan(improvedContract) : undefined;

    const finalPrompt: FinalPrompt = {
      status: "OK",
      prompt_text: promptText,
      alternatives,
      builder_plan: builderPlan,
      copy_instruction: builderPlan ? `Copy ONLY builder_plan into the File Builder tab.` : undefined,
      metadata: {
        pack_id: this.domainPack!.id,
        confidence: contract.meta.confidence || 0,
        generation_time: Date.now(),
        optimization_level: evaluation.overall_score >= 4.5 ? "excellent" : "good",
      },
    };

    console.log(`✅ Final prompt generated with ${alternatives.length} alternatives`);
    return finalPrompt;
  }

  // 🎯 MAIN PIPELINE: Compile → Evaluate → Patch → Final
  async runPipeline(userGoal: string, mode: "yaffa" | "discovery" = "yaffa"): Promise<FinalPrompt> {
    console.log(`🚀 Starting YAFFA Pipeline for: "${userGoal}"`);
    
    try {
      // Phase 1: Compile
      const contract = await this.compile(userGoal, mode);
      
      // Phase 2: Evaluate
      const evaluation = await this.evaluate(contract);
      
      // Phase 3: Patch
      const finalPrompt = await this.patch(contract, evaluation);
      
      console.log(`🎉 Pipeline complete! Status: ${finalPrompt.status}`);
      return finalPrompt;
      
    } catch (error) {
      console.error(`❌ Pipeline failed:`, error);
      throw error;
    }
  }

  // 🎯 SABI LOOP: Generate fresh prompt from feedback
  async sabiLoop(
    originalContract: PromptContract,
    llmResponse: string,
    userFeedback: string
  ): Promise<FinalPrompt> {
    console.log(`🔄 Running SABI Loop with user feedback`);
    
    // Analyze feedback and update contract
    const updatedContract = this.incorporateFeedback(originalContract, llmResponse, userFeedback);
    
    // Run evaluation and patch
    const evaluation = await this.evaluate(updatedContract);
    const finalPrompt = await this.patch(updatedContract, evaluation);
    
    return finalPrompt;
  }

  // 🔧 PRIVATE HELPER METHODS

  private calculateClarityScore(contract: PromptContract): number {
    // Implementation for clarity scoring
    let score = 5;
    if (!contract.objective.goal || contract.objective.goal.length < 10) score -= 2;
    if (!contract.objective.audience) score -= 1;
    return Math.max(0, score);
  }

  private calculateCompletenessScore(contract: PromptContract): number {
    // Implementation for completeness scoring
    let score = 5;
    const missingSlots = this.domainPack ? getMissingSlots(this.domainPack, contract.constraints as any) : [];
    score -= missingSlots.length * 0.5;
    return Math.max(0, score);
  }

  private calculateDeterminismScore(contract: PromptContract): number {
    // Implementation for determinism scoring
    let score = 5;
    if (contract.meta.mode === "yaffa") {
      if (contract.determinism.temperature > 0.3) score -= 2;
      if (!contract.determinism.seed) score -= 1;
      if (!contract.determinism.stop || contract.determinism.stop.length === 0) score -= 1;
    }
    return Math.max(0, score);
  }

  private calculateSafetyScore(contract: PromptContract): number {
    // Implementation for safety scoring
    let score = 5;
    if (this.domainPack?.safety_level === "critical") {
      if (!contract.constraints.safety || contract.constraints.safety.length === 0) score -= 3;
    }
    return Math.max(0, score);
  }

  private calculateBuilderScore(contract: PromptContract): number {
    // Implementation for builder scoring
    return this.domainPack?.builder ? 5 : 3;
  }

  private calculateAlternativesScore(contract: PromptContract): number {
    // Implementation for alternatives scoring
    return 4; // Default score
  }

  private calculateKnobsScore(contract: PromptContract): number {
    // Implementation for knobs scoring
    return 4; // Default score
  }

  private generateEdits(contract: PromptContract, scores: any): any[] {
    const edits = [];
    
    if (scores.clarity < 4) {
      edits.push({
        type: "tighten" as const,
        target: "objective.goal",
        reason: "Goal statement needs more clarity and specificity",
      });
    }
    
    if (scores.completeness < 4) {
      edits.push({
        type: "add" as const,
        target: "constraints",
        reason: "Missing key constraints for completeness",
      });
    }
    
    return edits;
  }

  private generateKnobSuggestions(contract: PromptContract, missingSlots: string[]): any[] {
    if (!this.domainPack) return [];
    
    const questions = getQuestionsFor(this.domainPack, missingSlots);
    return Object.entries(questions).map(([key, question]) => ({
      key,
      ask: question,
      current_value: undefined,
    }));
  }

  private identifyCriticalIssues(contract: PromptContract, scores: any): string[] {
    const issues = [];
    
    if (scores.safety < 3) {
      issues.push("Safety requirements not adequately specified");
    }
    
    if (scores.determinism < 3 && contract.meta.mode === "yaffa") {
      issues.push("Determinism settings insufficient for YAFFA mode");
    }
    
    return issues;
  }

  private applyEdits(contract: PromptContract, edits: any[]): PromptContract {
    // Implementation for applying edits
    return contract; // Simplified for now
  }

  private generateFinalPromptText(contract: PromptContract): string {
    if (!this.domainPack) return "";
    
    const persona = this.domainPack.persona;
    const mode = contract.meta.mode;
    
    return `SYSTEM:
You are ${persona.name} (${persona.role}). Traits: ${persona.traits.join(", ")}. Voice: ${persona.voice}.
Mode: ${mode.toUpperCase()}. Follow the Output Contract. No chain-of-thought.
If info is insufficient, STOP and return: {"status":"NEEDED","questions":["..."]}

USER:
Objective: ${contract.objective.goal}
Audience: ${contract.objective.audience || "general"}
Success Criteria: ${contract.objective.success_criteria.join(", ")}

Constraints:
  • timeframe: ${contract.constraints.timeframe || "not specified"}
  • tone: ${contract.constraints.tone || "professional"}
  • length: ${contract.constraints.length || "detailed"}
  • non_goals: ${contract.constraints.non_goals?.join(", ") || "none specified"}

Context:
${contract.grounding.glossary.join("\\n")}
${contract.grounding.citations_required ? "Citations required for all claims." : ""}

Output (JSON only; end with <END_JSON>):
{
  "status":"OK",
  "result": { /* concise, structured answer */ },
  "alternatives":[
    {"title":"Approach A","rationale":"..."},
    {"title":"Approach B","rationale":"..."}
  ]
}

Determinism: ${mode === "yaffa" ? "temperature=0.2; top_p=1; seed=7; stop=[<END_JSON>]" : "temperature=0.5; top_p=1; stop=[<END_JSON>]"}
<END_JSON>`;
  }

  private generateAlternatives(contract: PromptContract): any[] {
    return [
      {
        title: "Approach A",
        rationale: "Direct implementation following the specified constraints",
        prompt_text: contract.objective.goal,
      },
      {
        title: "Approach B", 
        rationale: "Alternative approach with different emphasis",
        prompt_text: contract.objective.goal,
      },
    ];
  }

  private generateBuilderPlan(contract: PromptContract): any {
    if (!this.domainPack?.builder) return undefined;
    
    return {
      type: this.domainPack.builder.type,
      version: "1",
      plan: JSON.parse(this.domainPack.builder.plan_schema_brief),
    };
  }

  private incorporateFeedback(contract: PromptContract, llmResponse: string, userFeedback: string): PromptContract {
    // Implementation for incorporating feedback
    return {
      ...contract,
      assumptions: [...contract.assumptions, `User feedback: ${userFeedback}`],
    };
  }
}

// 🚀 FACTORY FUNCTION
export function createCompiler(): YAFFACompiler {
  return new YAFFACompiler();
}
