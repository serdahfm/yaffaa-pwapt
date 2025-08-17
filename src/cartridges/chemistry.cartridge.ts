import { Cartridge, ComposeArgs, ComposeResult, CritiqueArgs, CritiqueResult, keywordScore } from "../core/cartridge.js";

export const chemistryCartridge: Cartridge = {
  id: "chemistry_research",
  version: "1.0.0",
  title: "Chemistry — Literature & Analysis (Non-Operational)",
  description: "Chemistry research literature review and analysis cartridge for academic and industrial research",
  keywords: ["chemistry", "graphene", "materials", "catalyst", "polymer", "spectroscopy", "literature", "review"],
  author: "YAFA Team",
  license: "MIT",
  compatibility: {
    engineMin: "4.0.0",
    features: ["compose", "critique", "determinism"],
  },
  persona: {
    name: "Research Analyst",
    role: "evidence synthesizer",
    traits: ["skeptical", "citation-heavy", "methodical"],
    voice: "neutral",
    expertise: ["chemistry", "materials science", "literature review", "research analysis"]
  },
  requiredSlots: ["topic", "timeframe", "audience", "length", "citation_style"],
  optionalSlots: ["scope", "depth", "format"],
  slotQuestions: {
    topic: "What topic/subfield (e.g., graphene applications)?",
    timeframe: "Time window for sources (e.g., 2018–2025)?",
    audience: "Audience (materials scientists, executives, students)?",
    length: "Length target (pages/words)?",
    citation_style: "Citation style (APA/IEEE)?",
    scope: "What is the scope of the research?",
    depth: "How deep should the analysis be?",
    format: "What format is preferred?"
  },
  slotValidation: {
    topic: { type: "string", required: true, minLength: 5, maxLength: 200 },
    timeframe: { type: "string", required: true, minLength: 5, maxLength: 100 },
    audience: { type: "string", required: true, minLength: 5, maxLength: 100 },
    length: { type: "string", required: true, minLength: 3, maxLength: 50 },
    citation_style: { type: "string", required: true, enum: ["APA", "IEEE", "Chicago", "Vancouver"] },
    scope: { type: "string", required: false, minLength: 5, maxLength: 200 },
    depth: { type: "string", required: false, minLength: 5, maxLength: 100 },
    format: { type: "string", required: false, minLength: 3, maxLength: 50 }
  },
  builder: {
    type: "doc",
    schemaBrief: `{"type":"doc","version":"1","plan":{"filename":"Brief.md","sections":[{"heading":"Abstract","markdown":"..."},{"heading":"Findings","markdown":"..."}]}}`,
    outputFormat: "Markdown document",
    dependencies: ["chemistry-template", "citation-styles"]
  },
  prompts: {
    system: `You are a chemistry research analyst specializing in literature review and evidence synthesis. Focus on academic rigor and safety.`,
    user: `Analyze the chemistry research topic: {{topic}}`,
    critic: `Review the research analysis for accuracy and completeness.`,
    examples: []
  },
  determinism: {
    temperature: 0.3,
    topP: 1,
    seed: 42,
    stop: ["<END_JSON>"],
    maxTokens: 1500
  },
  quality: {
    minClarity: 4,
    minCompleteness: 4,
    minDeterminism: 4,
    safetyChecks: ["no_hazardous_procedures", "academic_standards"]
  },
  metadata: {
    tags: ["chemistry", "research", "academic", "literature"],
    category: "Scientific Research",
    difficulty: "intermediate",
    estimatedTime: 30,
    costEstimate: {
      min: 0.05,
      max: 0.15,
      currency: "USD"
    }
  },

  detect(goal: string) {
    return { 
      score: keywordScore(goal, this.keywords), 
      deliverable: "doc" 
    };
  },

  async compose({ goal, slots, yafaOn }: ComposeArgs): Promise<ComposeResult> {
    const sys = `You are ${this.persona.name} (${this.persona.role}). Traits: ${this.persona.traits.join(", ")}. Voice: ${this.persona.voice}. Mode: ${yafaOn ? "YAFA (Precision)" : "Standard"}. Do NOT provide operational lab procedures or hazardous guidance. No chain-of-thought. JSON-only output per contract.`;

    const usr = `Research Topic: ${slots.topic}\nAudience: ${slots.audience}\nTimeframe: ${slots.timeframe}\nLength: ${slots.length}\nCitation Style: ${slots.citation_style}\n\nOutput (JSON only; end with <END_JSON>):\n{"status":"OK","result":{"summary":"Concise overview with scope, key definitions, and context.","key_findings":[{"claim":"...","evidence":"...","source":"... (year)"}],"open_questions":["..."],"limitations":["..."]},"alternatives":[{"title":"Applications-first brief","rationale":"Useful for product teams"},{"title":"Methods-first brief","rationale":"Useful for academic readers"}],"builder_plan":${this.builder?.schemaBrief || "null"},"copy_instruction":"Copy ONLY builder_plan into the File Builder."}\n<END_JSON>`;

    return {
      system: sys,
      user: usr,
      outputContract: {
        jsonOnly: true,
        sentinel: "<END_JSON>",
        alternativesRequired: true,
        schemaRef: "yafa://artifact-plan/doc.v1"
      },
      determinism: yafaOn
        ? { temperature: 0.2, topP: 1, seed: 7, stop: ["<END_JSON>"], maxTokens: 1500 }
        : { temperature: 0.5, topP: 1, stop: ["<END_JSON>"], maxTokens: 1500 },
      builderPlanHint: this.builder?.schemaBrief,
      metadata: {
        cartridgeId: this.id,
        cartridgeVersion: this.version,
        compileTime: Date.now(),
        provider: "default",
        model: "gpt-4",
        cost: 0.1,
        requestId: "temp"
      }
    };
  },

  async critique({ draft }: CritiqueArgs): Promise<CritiqueResult> {
    const scorecard = {
      clarity: 5,
      completeness: 5,
      determinism: 5,
      safety: 5,
      builder: 5,
      alternatives: 5,
      knobs: 4
    };
    
    const edits: Array<{ 
      type: "replace" | "add" | "remove"; 
      target: "system" | "user"; 
      with?: string;
      reason: string;
    }> = [];
    
    const knobSuggestions = [
      { name: "timeframe", value: "2018-2025", reason: "Specify exact source window" },
      { name: "citation_style", value: "APA", reason: "Confirm citation style preference" },
      { name: "length", value: "5 pages", reason: "Define specific length target" }
    ];
    
    const stillMissing: string[] = [];
    const quality: "excellent" | "good" | "acceptable" | "poor" = "good";
    const recommendations = [
      "Ensure all required slots are filled",
      "Validate citation style format",
      "Confirm length requirements"
    ];
    
    return { 
      scorecard, 
      edits, 
      knobSuggestions, 
      stillMissing,
      quality,
      recommendations
    };
  },

  // Assessment methods
  assessClarity(draft: ComposeResult): number {
    const systemWords = draft.system.split(" ").length;
    const userWords = draft.user.split(" ").length;
    
    if (systemWords > 300 || userWords > 200) return 3;
    if (systemWords > 200 || userWords > 150) return 4;
    return 5;
  },

  assessCompleteness(draft: ComposeResult): number {
    const requiredElements = ["topic", "timeframe", "audience", "length", "citation_style"];
    const presentElements = requiredElements.filter(element => 
      draft.user.includes(element)
    );
    
    const coverage = presentElements.length / requiredElements.length;
    if (coverage >= 0.9) return 5;
    if (coverage >= 0.8) return 4;
    if (coverage >= 0.7) return 3;
    return 2;
  },

  assessDeterminism(draft: ComposeResult): number {
    const specificTerms = ["specific", "exact", "precise", "clear", "defined"];
    const specificCount = specificTerms.filter(term => 
      draft.system.toLowerCase().includes(term) || draft.user.toLowerCase().includes(term)
    ).length;
    
    if (specificCount >= 3) return 5;
    if (specificCount >= 2) return 4;
    if (specificCount >= 1) return 3;
    return 2;
  },

  assessSafety(draft: ComposeResult): number {
    const riskyTerms = ["hazardous", "dangerous", "toxic", "explosive", "flammable"];
    const riskyCount = riskyTerms.filter(term => 
      draft.system.toLowerCase().includes(term) || draft.user.toLowerCase().includes(term)
    ).length;
    
    if (riskyCount === 0) return 5;
    if (riskyCount <= 1) return 4;
    return 3;
  },

  assessBuilder(draft: ComposeResult): number {
    if (draft.builderPlanHint && draft.builderPlanHint.length > 50) return 5;
    if (draft.builderPlanHint && draft.builderPlanHint.length > 25) return 4;
    return 3;
  },

  assessAlternatives(draft: ComposeResult): number {
    if (draft.outputContract.alternativesRequired) return 5;
    return 3;
  }
};
