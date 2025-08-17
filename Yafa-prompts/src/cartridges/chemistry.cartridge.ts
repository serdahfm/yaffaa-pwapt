import { Cartridge, ComposeArgs, ComposeResult, CritiqueArgs, CritiqueResult, keywordScore } from "../core/cartridge.js";

export const chemistryCartridge: Cartridge = {
  id: "chemistry_research",
  version: "1.0.0",
  title: "Chemistry — Literature & Analysis (Non-Operational)",
  description: "Research analysis and literature review for chemistry and materials science",
  keywords: ["chemistry", "graphene", "materials", "catalyst", "polymer", "spectroscopy", "literature", "review"],
  author: "YAFA Team",
  license: "MIT",
  compatibility: {
    engineMin: "4.0.0",
    features: ["compose", "critique", "determinism"],
  },
  persona: {
    name: "Dr. Elena Rodriguez",
    role: "Senior Research Analyst",
    traits: ["skeptical", "citation-heavy", "methodical", "evidence-based"],
    voice: "Academic, precise, and analytical",
    expertise: ["materials science", "chemical analysis", "literature review", "research synthesis"],
  },
  requiredSlots: ["topic", "timeframe", "audience", "length", "citation_style"],
  optionalSlots: ["focus_area", "methodology", "comparison_basis"],
  slotQuestions: {
    topic: "What specific chemistry topic or material should be analyzed?",
    timeframe: "What time window for sources (e.g., 2018–2025)?",
    audience: "Who is the target audience (researchers, students, industry)?",
    length: "What is the target length in words or pages?",
    citation_style: "What citation style should be used (APA, IEEE, ACS)?",
    focus_area: "What specific aspect should be emphasized?",
    methodology: "What research methodology should be highlighted?",
    comparison_basis: "What criteria should be used for comparisons?",
  },
  slotValidation: {
    topic: { type: "string", required: true, minLength: 5, maxLength: 200 },
    timeframe: { type: "string", required: true, minLength: 4, maxLength: 100 },
    audience: { type: "string", required: true, minLength: 5, maxLength: 100 },
    length: { type: "string", required: true, minLength: 3, maxLength: 50 },
    citation_style: { type: "string", required: true, enum: ["APA", "IEEE", "ACS", "Chicago"] },
    focus_area: { type: "string", required: false, minLength: 5, maxLength: 150 },
    methodology: { type: "string", required: false, minLength: 5, maxLength: 150 },
    comparison_basis: { type: "string", required: false, minLength: 5, maxLength: 150 },
  },
  builder: {
    type: "doc",
    schemaBrief: "Research brief with abstract, key findings, methodology comparison, and future directions",
    outputFormat: "Markdown document structure",
    dependencies: ["academic-template", "chemistry-icons"],
  },
  prompts: {
    system: "You are Dr. Elena Rodriguez, a Senior Research Analyst specializing in chemistry and materials science. You excel at synthesizing complex research findings into clear, actionable insights. Always emphasize safety and non-operational guidance.",
    user: "Analyze research on: {{topic}}. Timeframe: {{timeframe}}. Audience: {{audience}}. Length: {{length}}. Citation style: {{citation_style}}.",
    critic: "Review this chemistry research analysis for accuracy, completeness, and safety compliance. Ensure it provides valuable insights without operational guidance.",
    examples: [
      "Graphene synthesis methods comparison (2018-2025)",
      "Catalyst performance analysis for green chemistry",
      "Polymer degradation mechanisms literature review",
    ],
  },
  determinism: {
    temperature: 0.2,
    topP: 0.9,
    seed: 7,
    stop: ["<END>", "##"],
    maxTokens: 1500,
  },
  quality: {
    minClarity: 8,
    minCompleteness: 8,
    minDeterminism: 8,
    minSafety: 9,
  },
  metadata: {
    tags: ["chemistry", "research", "analysis", "materials"],
    category: "scientific-research",
    difficulty: "advanced",
    estimatedTime: 450,
  },

  detect(goal: string) {
    return { score: keywordScore(goal, this.keywords), deliverable: "chemistry_research" };
  },

  async compose(args: ComposeArgs): Promise<ComposeResult> {
    const { goal, slots, yafaOn, requestId } = args;
    
    const system = this.prompts.system;
    const user = this.prompts.user
      .replace("{{topic}}", slots.topic)
      .replace("{{timeframe}}", slots.timeframe)
      .replace("{{audience}}", slots.audience)
      .replace("{{length}}", slots.length)
      .replace("{{citation_style}}", slots.citation_style);

    return {
      system,
      user,
      outputContract: {
        jsonOnly: false,
        sentinel: "<END>",
        alternativesRequired: true,
        schemaRef: "yafa://artifact-plan/chemistry-research.v1",
      },
      determinism: yafaOn ? { ...this.determinism, temperature: 0.1 } : this.determinism,
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
    
    if (scorecard.safety < 8) {
      edits.push({
        type: "add",
        target: "system",
        with: "Emphasize safety considerations and non-operational guidance.",
        reason: "Improve safety score",
      });
    }

    const knobSuggestions = [
      { name: "timeframe", value: "2018-2025", reason: "Recent and relevant research coverage" },
      { name: "citation_style", value: "ACS", reason: "Standard for chemistry publications" },
      { name: "length", value: "1000-1500 words", reason: "Comprehensive yet focused analysis" },
    ];

    return {
      scorecard,
      edits,
      knobSuggestions,
      stillMissing: [],
      quality: scorecard.clarity >= 8 && scorecard.completeness >= 8 ? "excellent" : "good",
      recommendations: [
        "Include recent peer-reviewed sources",
        "Highlight safety considerations",
        "Provide clear methodology comparisons",
        "Suggest future research directions",
      ],
    };
  },

  // Helper methods for assessment
  assessClarity(draft: ComposeResult): number {
    const clarityIndicators = ["clear", "specific", "defined", "explained"];
    let score = 6;
    
    for (const indicator of clarityIndicators) {
      if (draft.system.toLowerCase().includes(indicator) || draft.user.toLowerCase().includes(indicator)) {
        score += 1;
      }
    }
    
    return Math.min(10, score);
  },

  assessCompleteness(draft: ComposeResult): number {
    const requiredElements = ["topic", "timeframe", "audience", "methodology"];
    let score = 6;
    
    for (const element of requiredElements) {
      if (draft.user.toLowerCase().includes(element)) {
        score += 1;
      }
    }
    
    return Math.min(10, score);
  },

  assessDeterminism(draft: ComposeResult): number {
    const deterministicElements = ["specific", "measurable", "defined", "exact"];
    let score = 7;
    
    for (const element of deterministicElements) {
      if (draft.user.toLowerCase().includes(element)) {
        score += 0.75;
      }
    }
    
    return Math.min(10, score);
  },

  assessSafety(draft: ComposeResult): number {
    const safetyElements = ["safety", "non-operational", "guidance", "caution"];
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
