export interface DomainPack {
  id: string;
  title: string;
  description: string;
  category: string;
  keywords: string[];
  persona: {
    name: string;
    role: string;
    traits: string[];
    voice: string;
    expertise: string[];
  };
  required_slots: string[];
  slot_questions: Record<string, string>;
  constraints_defaults: Partial<{
    timeframe: string;
    tone: string;
    length: string;
    complexity: string;
    audience_level: string;
  }>;
  rubric_weights: {
    clarity: number;
    completeness: number;
    determinism: number;
    safety: number;
    builder: number;
    alternatives: number;
    knobs: number;
  };
  builder?: {
    type: "pptx" | "xlsx" | "doc" | "web" | "code" | "pdf" | "zip";
    plan_schema_brief: string;
    output_formats: string[];
  };
  safety_level: "low" | "medium" | "high" | "critical";
  compliance_requirements?: string[];
}

// 🚀 SIMPLIFIED DOMAIN PACKS FOR TESTING
export const BUSINESS_PACKS: DomainPack[] = [
  {
    id: "executive_deck",
    title: "Executive Presentation Deck",
    description: "C-suite level presentations for board meetings, investor pitches, and strategic reviews",
    category: "Business & Strategy",
    keywords: ["pptx", "slide", "deck", "presentation", "pitch", "executive", "board", "investor", "strategy"],
    persona: {
      name: "Executive Strategist",
      role: "C-suite communications specialist",
      traits: ["concise", "evidence-driven", "outcome-oriented", "strategic"],
      voice: "executive",
      expertise: ["business strategy", "financial modeling", "stakeholder management", "market analysis"]
    },
    required_slots: ["purpose", "audience", "slide_count", "timeframe", "tone", "cta", "brand", "key_metrics"],
    slot_questions: {
      purpose: "What is the one-sentence purpose of this presentation?",
      audience: "Who is the audience (execs, board, investors, partners)?",
      slide_count: "How many slides (typically 5-15 for exec decks)?",
      timeframe: "What time window are we covering (e.g., 2025-Q1)?",
      tone: "What tone (executive, persuasive, informational, urgent)?",
      cta: "What is the call to action or decision needed?",
      brand: "What theme/accent color (e.g., Minimal, Corporate, #E11D48)?",
      key_metrics: "What are the 3-5 key metrics to highlight?"
    },
    constraints_defaults: { tone: "executive", length: "concise", complexity: "high-level" },
    rubric_weights: { clarity: 5, completeness: 5, determinism: 5, safety: 4, builder: 5, alternatives: 4, knobs: 4 },
    builder: {
      type: "pptx",
      plan_schema_brief: `{"type":"pptx","version":"1","plan":{"filename":"Executive_Deck.pptx","brand":{"theme":"Minimal","accent":"#E11D48"},"slides":[{"title":"Executive Summary","bullets":["..."],"notes":"..."},{"title":"Market Opportunity","bullets":["..."],"notes":"..."},{"title":"Financial Projections","bullets":["..."],"notes":"..."},{"title":"Strategic Roadmap","bullets":["..."],"notes":"..."},{"title":"Call to Action","bullets":["..."],"notes":"..."}]}}`,
      output_formats: ["pptx", "pdf"]
    },
    safety_level: "medium"
  }
];

export const TECH_PACKS: DomainPack[] = [
  {
    id: "software_api",
    title: "Software & API Development",
    description: "API endpoints, microservices, handlers, and software architecture",
    category: "Technology & Engineering",
    keywords: ["api", "endpoint", "microservice", "handler", "unit test", "swagger", "openapi", "software", "code"],
    persona: {
      name: "Senior Software Engineer",
      role: "Developer mentor and architect",
      traits: ["test-first", "security-aware", "precise", "scalable"],
      voice: "technical",
      expertise: ["API design", "software architecture", "testing", "security", "performance"]
    },
    required_slots: ["language", "runtime", "inputs", "outputs", "security", "tests", "perf", "architecture"],
    slot_questions: {
      language: "What programming language and minimum version?",
      runtime: "What runtime/OS/architecture requirements?",
      inputs: "What are the input formats and validation rules?",
      outputs: "What are the output formats and status codes?",
      security: "What authentication/authorization requirements?",
      tests: "What testing requirements (unit, integration, e2e)?",
      perf: "What performance targets (e.g., p95 <= 200ms)?",
      architecture: "What architectural patterns (REST, GraphQL, event-driven)?"
    },
    constraints_defaults: { tone: "technical", length: "detailed", complexity: "high" },
    rubric_weights: { clarity: 5, completeness: 5, determinism: 5, safety: 5, builder: 5, alternatives: 4, knobs: 4 },
    builder: {
      type: "code",
      plan_schema_brief: `{"type":"code","version":"1","plan":{"language":"python","filename":"api_service.py","entrypoint":"python api_service.py","files":[{"path":"api_service.py","content":"# ..."}],"tests":[{"name":"smoke","command":"pytest -q"},{"name":"integration","command":"pytest integration/"}]}}`,
      output_formats: ["zip", "py", "js", "java"]
    },
    safety_level: "high"
  }
];

// 🚀 COMPREHENSIVE DOMAIN LIBRARY
export const ALL_DOMAIN_PACKS: DomainPack[] = [
  ...BUSINESS_PACKS,
  ...TECH_PACKS
];

// 🚀 DOMAIN DETECTION FUNCTIONS
export function detectDomainPack(goal: string): {
  pack: DomainPack | null;
  confidence: number;
  alternatives: DomainPack[];
  needsDisambiguation: boolean;
} {
  const g = goal.toLowerCase();
  let best: { p: DomainPack; score: number } | null = null;
  const candidates: { p: DomainPack; score: number }[] = [];

  for (const pack of ALL_DOMAIN_PACKS) {
    const score = pack.keywords.reduce((s, k) => s + (g.includes(k) ? 1 : 0), 0);
    if (score > 0) {
      candidates.push({ p: pack, score });
      if (!best || score > best.score) {
        best = { p: pack, score };
      }
    }
  }

  // Sort by score for alternatives
  candidates.sort((a, b) => b.score - a.score);
  const alternatives = candidates.slice(1, 4).map(c => c.p);

  // Determine if disambiguation is needed
  const needsDisambiguation = candidates.length > 1 && 
    candidates[0].score === candidates[1].score && 
    candidates[0].score > 0;

  return {
    pack: best?.p || null,
    confidence: best ? best.score / best.p.keywords.length : 0,
    alternatives,
    needsDisambiguation
  };
}

export function getMissingSlots(pack: DomainPack, slots: Record<string, string>): string[] {
  return pack.required_slots.filter(k => !slots[k] || !String(slots[k]).trim());
}

export function getQuestionsFor(pack: DomainPack, missing: string[]): Record<string, string> {
  const questions: Record<string, string> = {};
  missing.forEach(k => {
    questions[k] = pack.slot_questions[k] || `Please provide: ${k}`;
  });
  return questions;
}

export function extractBuilderPlan(text: string): any {
  try {
    const withoutSentinel = text.replace(/<END_JSON>/g, "");
    const json = JSON.parse(withoutSentinel);
    return json.builder_plan || null;
  } catch {
    return null;
  }
}

// 🚀 DOMAIN PACK STATISTICS
export function getDomainStats() {
  const categories = ALL_DOMAIN_PACKS.reduce((acc, pack) => {
    acc[pack.category] = (acc[pack.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: ALL_DOMAIN_PACKS.length,
    categories,
    safetyLevels: {
      low: ALL_DOMAIN_PACKS.filter(p => p.safety_level === "low").length,
      medium: ALL_DOMAIN_PACKS.filter(p => p.safety_level === "medium").length,
      high: ALL_DOMAIN_PACKS.filter(p => p.safety_level === "high").length,
      critical: ALL_DOMAIN_PACKS.filter(p => p.safety_level === "critical").length
    }
  };
}
