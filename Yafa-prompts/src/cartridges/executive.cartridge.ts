import { Cartridge, ComposeArgs, ComposeResult, CritiqueArgs, CritiqueResult, keywordScore } from "../core/cartridge.js";

export const executiveCartridge: Cartridge = {
  id: "executive_deck",
  version: "1.0.0",
  title: "Executive Deck & Business Narrative",
  description: "Professional executive presentations and business narratives for C-suite communications",
  keywords: ["pptx", "slide", "deck", "presentation", "pitch", "executive", "board", "narrative", "business", "strategy"],
  author: "YAFA Team",
  license: "MIT",
  compatibility: {
    engineMin: "4.0.0",
    features: ["compose", "critique", "determinism"],
  },
  persona: {
    name: "Dr. Sarah Chen",
    role: "Senior Executive Strategist",
    traits: ["strategic", "data-driven", "executive-focused", "results-oriented"],
    voice: "Professional, confident, and action-oriented",
    expertise: ["business strategy", "executive communications", "board presentations", "market analysis"],
  },
  requiredSlots: ["purpose", "audience", "slide_count", "timeframe", "tone", "cta", "brand"],
  optionalSlots: ["budget", "stakeholders", "success_metrics", "risk_factors"],
  slotQuestions: {
    purpose: "What is the main objective of this presentation?",
    audience: "Who is the target audience (e.g., board members, investors, executives)?",
    slide_count: "How many slides should the presentation have?",
    timeframe: "What is the timeline for this project or initiative?",
    tone: "What tone should the presentation convey (e.g., confident, cautious, innovative)?",
    cta: "What is the call-to-action or next step?",
    brand: "What is the company or brand name?",
    budget: "What is the budget range for this initiative?",
    stakeholders: "Who are the key stakeholders involved?",
    success_metrics: "How will success be measured?",
    risk_factors: "What are the main risks or challenges?",
  },
  slotValidation: {
    purpose: { type: "string", required: true, minLength: 10, maxLength: 500 },
    audience: { type: "string", required: true, minLength: 5, maxLength: 200 },
    slide_count: { type: "number", required: true, minLength: 1, maxLength: 50 },
    timeframe: { type: "string", required: true, minLength: 5, maxLength: 200 },
    tone: { type: "string", required: true, enum: ["confident", "cautious", "innovative", "professional", "friendly"] },
    cta: { type: "string", required: true, minLength: 10, maxLength: 300 },
    brand: { type: "string", required: true, minLength: 2, maxLength: 100 },
    budget: { type: "string", required: false, minLength: 5, maxLength: 200 },
    stakeholders: { type: "string", required: false, minLength: 5, maxLength: 300 },
    success_metrics: { type: "string", required: false, minLength: 10, maxLength: 400 },
    risk_factors: { type: "string", required: false, minLength: 10, maxLength: 400 },
  },
  builder: {
    type: "pptx",
    schemaBrief: "Executive presentation with title slide, agenda, problem statement, solution overview, implementation plan, timeline, budget, risks, and next steps",
    outputFormat: "PowerPoint presentation structure",
    dependencies: ["executive-template", "business-icons"],
  },
  prompts: {
    system: "You are Dr. Sarah Chen, a Senior Executive Strategist with 15+ years of experience in C-suite communications and business strategy. You excel at creating compelling executive presentations that drive decision-making and action.",
    user: "Create an executive presentation for: {{purpose}}. Target audience: {{audience}}. Number of slides: {{slide_count}}. Timeline: {{timeframe}}. Tone: {{tone}}. Call-to-action: {{cta}}. Brand: {{brand}}.",
    critic: "Review this executive presentation for strategic clarity, business impact, and decision-making value. Ensure it meets executive standards.",
    examples: [
      "Board presentation for Q4 results and strategic initiatives",
      "Investor pitch for Series B funding round",
      "Executive summary for digital transformation project",
    ],
  },
  determinism: {
    temperature: 0.3,
    topP: 0.9,
    seed: 42,
    stop: ["<END>", "##"],
    maxTokens: 2000,
  },
  quality: {
    minClarity: 8,
    minCompleteness: 8,
    minDeterminism: 7,
    minSafety: 9,
  },
  metadata: {
    tags: ["executive", "business", "strategy", "presentation"],
    category: "business-communications",
    difficulty: "intermediate",
    estimatedTime: 300,
  },

  detect(goal: string) {
    return { score: keywordScore(goal, this.keywords), deliverable: "executive_deck" };
  },

  async compose(args: ComposeArgs): Promise<ComposeResult> {
    const { goal, slots, yafaOn, requestId } = args;
    
    const system = this.prompts.system;
    const user = this.prompts.user
      .replace("{{purpose}}", slots.purpose)
      .replace("{{audience}}", slots.audience)
      .replace("{{slide_count}}", slots.slide_count)
      .replace("{{timeframe}}", slots.timeframe)
      .replace("{{tone}}", slots.tone)
      .replace("{{cta}}", slots.cta)
      .replace("{{brand}}", slots.brand);

    return {
      system,
      user,
      outputContract: {
        jsonOnly: false,
        sentinel: "<END>",
        alternativesRequired: true,
        schemaRef: "yafa://artifact-plan/executive-deck.v1",
      },
      determinism: yafaOn ? { ...this.determinism, temperature: 0.2 } : this.determinism,
      builderPlanHint: this.builder.schemaBrief,
      metadata: {
        cartridgeId: this.id,
        cartridgeVersion: this.version,
        compileTime: 0,
        provider: "default",
        model: "default",
        cost: 0,
        requestId,
      },
    };
  },

  async critique(args: CritiqueArgs): Promise<CritiqueResult> {
    const { draft, requestId } = args;
    
    const scorecard = {
      clarity: this.assessClarity(draft),
      completeness: this.assessCompleteness(draft),
      determinism: this.assessDeterminism(draft),
      safety: this.assessSafety(draft),
      builder: this.assessBuilder(draft),
      alternatives: this.assessAlternatives(draft),
      knobs: 8,
    };

    const edits: Array<{ type: "replace" | "add" | "remove"; target: "system" | "user"; with?: string; reason: string }> = [];
    
    if (scorecard.clarity < 7) {
      edits.push({
        type: "add",
        target: "system",
        with: "Focus on clear, actionable language and avoid jargon.",
        reason: "Improve clarity score",
      });
    }

    const knobSuggestions = [
      { name: "slide_count", value: "5-7", reason: "Optimal for executive attention span" },
      { name: "tone", value: "confident", reason: "Builds trust and authority" },
      { name: "timeframe", value: "3-6 months", reason: "Realistic for implementation" },
    ];

    return {
      scorecard,
      edits,
      knobSuggestions,
      stillMissing: [],
      quality: scorecard.clarity >= 8 && scorecard.completeness >= 8 ? "excellent" : "good",
      recommendations: [
        "Ensure each slide has a clear purpose",
        "Include data-driven insights where possible",
        "End with specific next steps and ownership",
      ],
    };
  },

  // Helper methods for assessment
  assessClarity(draft: ComposeResult): number {
    const clarityIndicators = ["clear", "specific", "actionable", "measurable"];
    let score = 5;
    
    for (const indicator of clarityIndicators) {
      if (draft.system.toLowerCase().includes(indicator) || draft.user.toLowerCase().includes(indicator)) {
        score += 1;
      }
    }
    
    return Math.min(10, score);
  },

  assessCompleteness(draft: ComposeResult): number {
    const requiredElements = ["purpose", "audience", "timeline", "action"];
    let score = 5;
    
    for (const element of requiredElements) {
      if (draft.user.toLowerCase().includes(element)) {
        score += 1;
      }
    }
    
    return Math.min(10, score);
  },

  assessDeterminism(draft: ComposeResult): number {
    const deterministicElements = ["specific", "measurable", "concrete", "exact"];
    let score = 5;
    
    for (const element of deterministicElements) {
      if (draft.user.toLowerCase().includes(element)) {
        score += 1;
      }
    }
    
    return Math.min(10, score);
  },

  assessSafety(draft: ComposeResult): number {
    const safetyElements = ["professional", "appropriate", "ethical", "compliant"];
    let score = 8;
    
    for (const element of safetyElements) {
      if (draft.system.toLowerCase().includes(element)) {
        score += 0.5;
      }
    }
    
    return Math.min(10, score);
  },

  assessBuilder(draft: ComposeResult): number {
    return draft.builderPlanHint ? 9 : 5;
  },

  assessAlternatives(draft: ComposeResult): number {
    return draft.outputContract.alternativesRequired ? 8 : 5;
  },
};
