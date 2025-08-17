import { Router } from "express";
import { Compiler } from "../core/compiler.js";
import { CartridgeRegistry } from "../core/cartridge.js";
import { validateCompileInput, validateSabiInput } from "../lib/validators.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Initialize core components
const cartridgeRegistry = new CartridgeRegistry();
const compiler = new Compiler(cartridgeRegistry);

// Register some example cartridges
// In production, these would be loaded from files or a database
cartridgeRegistry.register({
  id: "executive",
  version: "1.0.0",
  title: "Executive Communication",
  description: "Professional executive-level communication and presentations",
  keywords: ["executive", "business", "communication", "presentation"],
  author: "YAFA Team",
  license: "MIT",
  compatibility: {
    engine: "yafa",
    minVersion: "4.0.0",
  },
  persona: {
    name: "Executive Strategist",
    role: "Senior Business Advisor",
    voice: "Professional and authoritative",
    expertise: ["business strategy", "executive communications", "stakeholder management"],
    background: "20+ years in executive leadership and strategic consulting",
  },
  requiredSlots: ["context", "audience", "objective"],
  optionalSlots: ["tone", "length", "format"],
  slotQuestions: {
    context: "What is the business context or situation?",
    audience: "Who is the target audience?",
    objective: "What is the main objective or desired outcome?",
    tone: "What tone should be used? (formal, conversational, etc.)",
    length: "How long should the communication be?",
    format: "What format is preferred? (email, presentation, memo, etc.)",
  },
  prompts: {
    system: "You are an experienced executive strategist with deep expertise in business communications. Your role is to create clear, compelling, and actionable executive-level communications that drive results.",
    user: "Create a professional {format} for {audience} about {context} with the objective of {objective}. Use a {tone} tone and keep it {length}.",
    critic: "Review this executive communication for clarity, professionalism, and effectiveness. Ensure it meets executive standards and drives the intended outcome.",
    examples: [
      {
        input: "Context: Q4 results presentation, Audience: Board of Directors, Objective: Secure approval for expansion plan",
        output: "Professional board presentation with clear data visualization and strategic recommendations",
        explanation: "Executive-level presentation with data-driven insights and clear action items",
      },
    ],
  },
  determinism: {
    temperature: 0.7,
    topP: 1,
    maxTokens: 1000,
  },
  quality: {
    minClarity: 9,
    minCompleteness: 8,
    minDeterminism: 8,
    minSafety: 9,
  },
  builder: {
    schemaBrief: "Executive communication with clear structure and actionable insights",
    validationRules: ["Must be professional", "Include clear objectives", "Provide actionable next steps"],
    suggestions: ["Use data to support points", "Address potential concerns", "Include timeline considerations"],
  },
  metadata: {
    category: "business",
    difficulty: "intermediate",
  },
});

cartridgeRegistry.register({
  id: "chemistry",
  version: "1.0.0",
  title: "Chemistry Research",
  description: "Scientific research and analysis in chemistry",
  keywords: ["chemistry", "research", "scientific", "analysis", "laboratory"],
  author: "YAFA Team",
  license: "MIT",
  compatibility: {
    engine: "yafa",
    minVersion: "4.0.0",
  },
  persona: {
    name: "Chemistry Researcher",
    role: "Senior Research Scientist",
    voice: "Scientific and precise",
    expertise: ["chemical analysis", "laboratory procedures", "research methodology"],
    background: "PhD in Chemistry with 15+ years of research experience",
  },
  requiredSlots: ["research_question", "methodology", "materials"],
  optionalSlots: ["safety_notes", "expected_outcomes"],
  slotQuestions: {
    research_question: "What is the main research question or hypothesis?",
    methodology: "What experimental methodology will be used?",
    materials: "What materials and equipment are needed?",
    safety_notes: "What safety considerations should be noted?",
    expected_outcomes: "What outcomes are expected from this research?",
  },
  prompts: {
    system: "You are a senior chemistry researcher with extensive experience in laboratory procedures and scientific analysis. Your role is to provide accurate, detailed, and safety-conscious research guidance.",
    user: "Design a research protocol for investigating {research_question} using {methodology} with {materials}. Include {safety_notes} and describe {expected_outcomes}.",
    critic: "Review this research protocol for scientific accuracy, safety considerations, and methodological soundness. Ensure all procedures are clear and reproducible.",
    examples: [
      {
        input: "Research Question: Effect of temperature on reaction rate, Methodology: Kinetic analysis, Materials: Standard laboratory equipment",
        output: "Comprehensive research protocol with safety measures and data collection methods",
        explanation: "Scientifically rigorous protocol with clear methodology and safety considerations",
      },
    ],
  },
  determinism: {
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 1500,
  },
  quality: {
    minClarity: 9,
    minCompleteness: 9,
    minDeterminism: 9,
    minSafety: 10,
  },
  builder: {
    schemaBrief: "Scientific research protocol with methodology, safety, and expected outcomes",
    validationRules: ["Must be scientifically accurate", "Include safety procedures", "Provide clear methodology"],
    suggestions: ["Reference relevant literature", "Include control experiments", "Specify data analysis methods"],
  },
  metadata: {
    category: "science",
    difficulty: "advanced",
  },
});

/**
 * @swagger
 * /cartridges:
 *   get:
 *     summary: List all available cartridges
 *     tags: [Cartridges]
 *     responses:
 *       200:
 *         description: List of cartridges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cartridge'
 */
router.get("/cartridges", (req, res) => {
  try {
    const cartridges = cartridgeRegistry.getAll();
    res.json({
      success: true,
      data: cartridges,
      count: cartridges.length,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("Error fetching cartridges", { error: error instanceof Error ? error.message : String(error), requestId: req.requestId });
    res.status(500).json({
      success: false,
      error: "Failed to fetch cartridges",
      requestId: req.requestId,
    });
  }
});

/**
 * @swagger
 * /cartridges/{id}:
 *   get:
 *     summary: Get cartridge details
 *     tags: [Cartridges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cartridge details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cartridge'
 *       404:
 *         description: Cartridge not found
 */
router.get("/cartridges/:id", (req, res) => {
  try {
    const { id } = req.params;
    const cartridge = cartridgeRegistry.get(id);
    
    if (!cartridge) {
      return res.status(404).json({
        success: false,
        error: "Cartridge not found",
        requestId: req.requestId,
      });
    }
    
    res.json({
      success: true,
      data: cartridge,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("Error fetching cartridge", { error: error instanceof Error ? error.message : String(error), requestId: req.requestId });
    res.status(500).json({
      success: false,
      error: "Failed to fetch cartridge",
      requestId: req.requestId,
    });
  }
});

/**
 * @swagger
 * /compile:
 *   post:
 *     summary: Compile a prompt using cartridges
 *     tags: [Compilation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompileInput'
 *     responses:
 *       200:
 *         description: Compilation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompileOutput'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Compilation error
 */
router.post("/compile", async (req, res) => {
  try {
    const input = validateCompileInput(req.body);
    
    logger.info("Compilation request", { 
      goal: input.goal, 
      yafaOn: input.yafaOn, 
      requestId: input.requestId 
    });
    
    const result = await compiler.compile(input);
    
    res.json({
      success: true,
      data: result,
      requestId: input.requestId,
    });
  } catch (error) {
    logger.error("Compilation error", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    
    if (error instanceof Error && error.message.includes("validation")) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        details: error.message,
        requestId: req.requestId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Compilation failed",
        requestId: req.requestId,
      });
    }
  }
});

/**
 * @swagger
 * /compile/async:
 *   post:
 *     summary: Compile a prompt asynchronously
 *     tags: [Compilation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompileInput'
 *     responses:
 *       200:
 *         description: Job queued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 */
router.post("/compile/async", async (req, res) => {
  try {
    const input = validateCompileInput(req.body);
    
    logger.info("Async compilation request", { 
      goal: input.goal, 
      yafaOn: input.yafaOn, 
      requestId: input.requestId 
    });
    
    const result = await compiler.compileAsync(input);
    
    res.json({
      success: true,
      data: result,
      requestId: input.requestId,
    });
  } catch (error) {
    logger.error("Async compilation error", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    
    if (error instanceof Error && error.message.includes("validation")) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        details: error.message,
        requestId: req.requestId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to queue compilation job",
        requestId: req.requestId,
      });
    }
  }
});

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get job status
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobStatus'
 *       404:
 *         description: Job not found
 */
router.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const status = await compiler.getJobStatus(id);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: "Job not found",
        requestId: req.requestId,
      });
    }
    
    res.json({
      success: true,
      data: status,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("Error fetching job status", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch job status",
      requestId: req.requestId,
    });
  }
});

/**
 * @swagger
 * /jobs/stats:
 *   get:
 *     summary: Get job queue statistics
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job queue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     queued:
 *                       type: number
 *                     running:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     cancelled:
 *                       type: number
 */
router.get("/jobs/stats", async (req, res) => {
  try {
    const stats = await compiler.getJobStatus("stats"); // This is a placeholder
    
    res.json({
      success: true,
      data: {
        total: 0,
        queued: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      },
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("Error fetching job stats", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch job statistics",
      requestId: req.requestId,
    });
  }
});

/**
 * @swagger
 * /runs:
 *   get:
 *     summary: List run manifests
 *     tags: [Runs]
 *     responses:
 *       200:
 *         description: List of run manifests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RunManifest'
 */
router.get("/runs", async (req, res) => {
  try {
    const manifests = await compiler.getAllRunManifests();
    
    res.json({
      success: true,
      data: manifests,
      count: manifests.length,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("Error fetching run manifests", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch run manifests",
      requestId: req.requestId,
    });
  }
});

/**
 * @swagger
 * /runs/{id}:
 *   get:
 *     summary: Get run manifest details
 *     tags: [Runs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run manifest details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RunManifest'
 *       404:
 *         description: Run manifest not found
 */
router.get("/runs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const manifest = await compiler.getRunManifest(id);
    
    if (!manifest) {
      return res.status(404).json({
        success: false,
        error: "Run manifest not found",
        requestId: req.requestId,
      });
    }
    
    res.json({
      success: true,
      data: manifest,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("Error fetching run manifest", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    res.status(500).json({
      success: false,
      error: "Failed to fetch run manifest",
      requestId: req.requestId,
    });
  }
});

/**
 * @swagger
 * /sabi:
 *   post:
 *     summary: SABI loop for prompt refinement
 *     tags: [SABI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SabiInput'
 *     responses:
 *       200:
 *         description: Refined prompt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     improvedPrompt:
 *                       type: string
 *                     reasoning:
 *                       type: string
 *                     confidence:
 *                       type: number
 */
router.post("/sabi", async (req, res) => {
  try {
    const input = validateSabiInput(req.body);
    
    logger.info("SABI loop request", { 
      requestId: req.requestId 
    });
    
    // This would implement the SABI loop logic
    // For now, return a mock response
    const result = {
      improvedPrompt: "This is an improved version of your prompt based on the SABI analysis.",
      reasoning: "The original prompt was analyzed for clarity, completeness, and effectiveness. Improvements focus on specificity and actionable outcomes.",
      confidence: 0.85,
    };
    
    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (error) {
    logger.error("SABI loop error", { 
      error: error instanceof Error ? error.message : String(error), 
      requestId: req.requestId 
    });
    
    if (error instanceof Error && error.message.includes("validation")) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        details: error.message,
        requestId: req.requestId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "SABI loop failed",
        requestId: req.requestId,
      });
    }
  }
});

export { router as routes };
