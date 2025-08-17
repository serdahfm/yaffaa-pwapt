// Example of a re-implemented, template-free cartridge
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
    system: `You are Dr. Sarah Chen, a Senior Executive Strategist with 15+ years of experience in C-suite communications and business strategy.

## 👔 Executive Expertise
- Strategic Planning: Market analysis, competitive positioning, growth strategies
- Executive Communications: Board presentations, investor relations, stakeholder management
- Business Transformation: Change management, digital transformation, operational excellence
- Financial Acumen: ROI analysis, budget planning, risk assessment

## 🎯 Communication Style
- Clear, concise, and actionable insights
- Data-driven recommendations with supporting evidence
- Executive-level language that builds confidence
- Focus on business impact and strategic value

## 📊 Presentation Structure
- Executive Summary: Key points and recommendations
- Problem Statement: Clear articulation of challenges
- Solution Overview: Strategic approach and methodology
- Implementation Plan: Phases, milestones, and deliverables
- Timeline & Budget: Realistic estimates and resource requirements
- Risk Assessment: Identified risks and mitigation strategies
- Next Steps: Clear call-to-action and immediate actions

## 🚫 What to Avoid
- Technical jargon or overly complex explanations
- Generic business buzzwords without substance
- Overly optimistic projections without data support
- Vague recommendations without clear implementation steps

## ✅ Quality Standards
- Each slide should have a clear purpose and message
- Use bullet points for readability and impact
- Include relevant data, metrics, or examples
- Ensure logical flow and narrative coherence
- End with actionable next steps and clear ownership`,

    user: `## 👔 Executive Brief Question
**Objective:** Create a professional executive presentation for: {{purpose}}

**Target Audience:** {{audience}}

**Success Criteria:** 
- Clear problem framing and solution articulation
- {{slide_count}} well-structured slides
- Explicit next-step ask and ownership
- Professional, executive-ready quality

**Constraints:**
- Timeframe: {{timeframe}}
- Tone: {{tone}}
- Length: Concise and impactful
- Non-goals: Marketing fluff, generic content

**Context:**
- Brand: {{brand}}
- Call-to-action: {{cta}}
- {{#budget}}Budget: {{budget}}{{/budget}}
- {{#stakeholders}}Stakeholders: {{stakeholders}}{{/stakeholders}}
- {{#success_metrics}}Success Metrics: {{success_metrics}}{{/success_metrics}}
- {{#risk_factors}}Risk Factors: {{risk_factors}}{{/risk_factors}}

**Output (JSON only; end with <END_JSON>):**
{
  "status": "OK",
  "result": {
    "deck_outline": "Detailed slide-by-slide breakdown with titles, key points, and content structure",
    "talking_points": "Executive summary and key messages for each slide",
    "visual_elements": "Recommended charts, graphs, and visual aids",
    "timing_guide": "Suggested time allocation for each section"
  },
  "alternatives": [
    {
      "title": "Metrics-first narrative",
      "rationale": "ROI-minded executives who prioritize financial impact"
    },
    {
      "title": "Risk-mitigation narrative", 
      "rationale": "Compliance-driven organizations focused on risk management"
    }
  ],
  "builder_plan": "{{builder.schemaBrief}}",
  "copy_instruction": "Copy ONLY builder_plan into the File Builder."
}
<END_JSON>`,

    critic: `## 👔 Executive Quality Assurance
You are a Senior Business Strategy Quality Expert reviewing executive presentations for strategic clarity, business impact, and decision-making value.

## 🔍 Review Criteria
1. **Strategic Clarity**: Is the problem and solution clearly articulated?
2. **Business Impact**: Are the benefits and ROI clearly stated?
3. **Executive Readiness**: Is the content appropriate for C-suite audience?
4. **Actionability**: Are next steps clear and assignable?
5. **Professional Quality**: Is the presentation polished and executive-ready?

## 📋 Evaluation Checklist
- [ ] Problem statement is clear and compelling
- [ ] Solution approach is strategic and well-articulated
- [ ] Implementation plan is realistic and actionable
- [ ] Timeline and budget estimates are credible
- [ ] Risk assessment is thorough and mitigation strategies are clear
- [ ] Next steps are specific and have clear ownership
- [ ] Content is executive-level and professional
- [ ] Visual elements enhance rather than distract from the message

## 🎯 Quality Score (1-5)
- **Clarity**: How clear and understandable is the presentation?
- **Completeness**: Does it cover all necessary aspects?
- **Determinism**: Are the recommendations specific and actionable?
- **Safety**: Are there any inappropriate or risky statements?
- **Builder**: Does it provide clear guidance for presentation creation?
- **Alternatives**: Are the alternative approaches valuable and well-reasoned?

## 💡 Improvement Suggestions
- Identify areas that need more specificity or clarity
- Suggest additional content or visual elements
- Recommend tone or style adjustments
- Highlight any missing critical information

## 🚨 Critical Issues
- Flag any content that could be misleading or inappropriate
- Identify gaps in logic or missing critical steps
- Note any unrealistic projections or assumptions`,

    examples: [
      {
        input: {
          purpose: "Launch new product line in Q3",
          audience: "Board of Directors",
          slide_count: 12,
          timeframe: "6 months",
          tone: "confident",
          cta: "Approve $2M budget allocation",
          brand: "TechCorp",
          budget: "$2M",
          stakeholders: "Product, Marketing, Sales teams",
          success_metrics: "Revenue target $10M in first year",
          risk_factors: "Market competition, supply chain delays"
        },
        output: "Professional 12-slide board presentation for new product launch with clear budget request and risk mitigation strategies",
        quality: 5
      },
      {
        input: {
          purpose: "Digital transformation initiative",
          audience: "C-Suite executives",
          slide_count: 8,
          timeframe: "18 months",
          tone: "innovative",
          cta: "Approve transformation roadmap",
          brand: "GlobalCorp"
        },
        output: "Strategic 8-slide presentation for digital transformation with phased approach and clear success metrics",
        quality: 4
      }
    ],
  },
  determinism: {
    temperature: 0.3,
    topP: 1,
    seed: 42,
    stop: ["<END_JSON>"],
    maxTokens: 1500,
  },
  quality: {
    minClarity: 4,
    minCompleteness: 4,
    minDeterminism: 4,
    safetyChecks: ["business-ethics", "financial-accuracy", "executive-appropriateness"],
  },
  metadata: {
    tags: ["executive", "presentation", "business", "strategy", "board"],
    category: "Business Communications",
    difficulty: "intermediate",
    estimatedTime: 45,
    costEstimate: {
      min: 0.05,
      max: 0.15,
      currency: "USD",
    },
  },

  detect(goal: string) {
    const score = keywordScore(goal, this.keywords);
    const confidence = score > 0.3 ? 0.9 : score > 0.1 ? 0.6 : 0.3;
    
    return {
      score: score * 100,
      confidence,
      matchedKeywords: this.keywords.filter(k => goal.toLowerCase().includes(k.toLowerCase())),
      reasoning: `Executive presentation cartridge matched with ${(score * 100).toFixed(1)}% relevance based on keywords: ${this.keywords.filter(k => goal.toLowerCase().includes(k.toLowerCase())).join(", ")}`,
    };
  },

  async compose(args: ComposeArgs): Promise<ComposeResult> {
    const { goal, slots, yafaOn, requestId, userId } = args;
    
    // Build dynamic prompts based on slots
    let systemPrompt = this.prompts.system;
    let userPrompt = this.prompts.user;
    
    // Replace slot placeholders
    for (const [slot, value] of Object.entries(slots)) {
      const placeholder = `{{${slot}}}`;
      const replacement = String(value);
      
      systemPrompt = systemPrompt.replace(new RegExp(placeholder, "g"), replacement);
      userPrompt = userPrompt.replace(new RegExp(placeholder, "g"), replacement);
    }
    
    // Add YAFA mode indicators
    if (yafaOn) {
      systemPrompt += "\n\nYAFA MODE: High precision, deterministic output required. Focus on clarity and actionable insights.";
      userPrompt += "\n\nYAFA REQUIREMENTS: Ensure all recommendations are specific, measurable, and immediately actionable.";
    }

    return {
      system: systemPrompt,
      user: userPrompt,
      outputContract: {
        jsonOnly: true,
        sentinel: "<END_JSON>",
        alternativesRequired: true,
        schemaRef: "yafa://artifact-plan/pptx.v1",
      },
      determinism: {
        temperature: yafaOn ? 0.2 : this.determinism.temperature,
        topP: this.determinism.topP,
        seed: yafaOn ? 7 : this.determinism.seed,
        stop: this.determinism.stop,
        maxTokens: this.determinism.maxTokens,
      },
      builderPlanHint: this.builder?.schemaBrief,
      metadata: {
        cartridgeId: this.id,
        cartridgeVersion: this.version,
        compileTime: 0, // Will be set by compiler
        provider: "default",
        model: "default",
        cost: 0, // Will be set by provider
        requestId,
      },
    };
  },

  async critique(args: CritiqueArgs): Promise<CritiqueResult> {
    const { draft, packId, requestId } = args;
    
    // Analyze the draft for quality metrics
    const scorecard = {
      clarity: this.assessClarity(draft),
      completeness: this.assessCompleteness(draft),
      determinism: this.assessDeterminism(draft),
      safety: this.assessSafety(draft),
      builder: this.assessBuilder(draft),
      alternatives: this.assessAlternatives(draft),
      knobs: 4, // Default score
    };

    const edits: Array<{
      type: "replace" | "add" | "remove";
      target: "system" | "user";
      with?: string;
      reason: string;
    }> = [];

    const knobSuggestions = [
      { name: "temperature", value: 0.2, reason: "Lower for more deterministic executive output" },
      { name: "maxTokens", value: 2000, reason: "Increase for more detailed presentation guidance" },
    ];

    const stillMissing: string[] = [];
    const quality: "excellent" | "good" | "acceptable" | "poor" = 
      scorecard.clarity >= 4 && scorecard.completeness >= 4 && scorecard.determinism >= 4 ? "excellent" :
      scorecard.clarity >= 3 && scorecard.completeness >= 3 && scorecard.determinism >= 3 ? "good" :
      scorecard.clarity >= 2 && scorecard.completeness >= 2 && scorecard.determinism >= 2 ? "acceptable" : "poor";

    const recommendations = [
      "Ensure all slides have clear, actionable content",
      "Include specific metrics and success criteria",
      "Provide clear timeline and budget estimates",
      "Address potential risks and mitigation strategies",
    ];

    return {
      scorecard,
      edits,
      knobSuggestions,
      stillMissing,
      quality,
      recommendations,
    };
  },

  // Helper methods for assessment
  assessClarity(draft: ComposeResult): number {
    const systemWords = draft.system.split(" ").length;
    const userWords = draft.user.split(" ").length;
    
    // Prefer concise but clear prompts
    if (systemWords > 500 || userWords > 300) return 3;
    if (systemWords > 300 || userWords > 200) return 4;
    return 5;
  },

  assessCompleteness(draft: ComposeResult): number {
    const requiredElements = ["purpose", "audience", "slide_count", "timeframe", "tone", "cta", "brand"];
    const presentElements = requiredElements.filter(element => 
      draft.user.includes(`{{${element}}}`) || draft.user.includes(element)
    );
    
    const coverage = presentElements.length / requiredElements.length;
    if (coverage >= 0.9) return 5;
    if (coverage >= 0.8) return 4;
    if (coverage >= 0.7) return 3;
    return 2;
  },

  assessDeterminism(draft: ComposeResult): number {
    const specificTerms = ["specific", "measurable", "actionable", "clear", "explicit"];
    const specificCount = specificTerms.filter(term => 
      draft.system.toLowerCase().includes(term) || draft.user.toLowerCase().includes(term)
    ).length;
    
    if (specificCount >= 4) return 5;
    if (specificCount >= 3) return 4;
    if (specificCount >= 2) return 3;
    return 2;
  },

  assessSafety(draft: ComposeResult): number {
    const riskyTerms = ["guarantee", "promise", "always", "never", "best", "perfect"];
    const riskyCount = riskyTerms.filter(term => 
      draft.system.toLowerCase().includes(term) || draft.user.toLowerCase().includes(term)
    ).length;
    
    if (riskyCount === 0) return 5;
    if (riskyCount <= 1) return 4;
    if (riskyCount <= 2) return 3;
    return 2;
  },

  assessBuilder(draft: ComposeResult): number {
    if (draft.builderPlanHint && draft.builderPlanHint.length > 10) return 5;
    if (draft.builderPlanHint && draft.builderPlanHint.length > 5) return 4;
    return 3;
  },

  assessAlternatives(draft: ComposeResult): number {
    // This would analyze the alternatives in the output
    // For now, return a default score
    return 4;
  },
};
