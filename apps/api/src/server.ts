import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { z } from "zod";
import dotenv from "dotenv";
import { createCompiler } from "@yafa/compiler";
import { ALL_DOMAIN_PACKS, getDomainStats, detectDomainPack } from "@yafa/domain-packs";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(json({ limit: "10mb" }));

// Initialize YAFFA Compiler
const compiler = createCompiler();

// 🚀 HEALTH CHECK
app.get("/health", (_req, res) => {
  res.json({ 
    status: "healthy", 
    service: "YAFFA Engine v2.0 - DOMAIN EMPIRE",
    timestamp: new Date().toISOString(),
    version: "2.0.0"
  });
});

// 🚀 DOMAIN PACKS ENDPOINTS
app.get("/api/domains", (_req, res) => {
  const stats = getDomainStats();
  res.json({
    success: true,
    data: {
      total_packs: stats.total,
      categories: stats.categories,
      safety_levels: stats.safetyLevels,
      packs: ALL_DOMAIN_PACKS.map(pack => ({
        id: pack.id,
        title: pack.title,
        category: pack.category,
        description: pack.description,
        safety_level: pack.safety_level,
        has_builder: !!pack.builder
      }))
    }
  });
});

app.get("/api/domains/:id", (req, res) => {
  const pack = ALL_DOMAIN_PACKS.find(p => p.id === req.params.id);
  if (!pack) {
    return res.status(404).json({ error: "Domain pack not found" });
  }
  res.json({ success: true, data: pack });
});

// 🚀 CORE YAFFA ENGINE ENDPOINTS

// POST /api/compile - Main compilation endpoint
app.post("/api/compile", async (req, res) => {
  try {
    const { goal, mode = "yaffa" } = req.body;
    
    if (!goal) {
      return res.status(400).json({ error: "Goal is required" });
    }

    console.log(`🎯 Compiling: "${goal}" in ${mode} mode`);
    
    const result = await compiler.runPipeline(goal, mode);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        mode,
        goal_length: goal.length
      }
    });
    
  } catch (error) {
    console.error("❌ Compilation error:", error);
    res.status(500).json({ 
      error: "Compilation failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// POST /api/evaluate - Evaluate a prompt contract
app.post("/api/evaluate", async (req, res) => {
  try {
    const { contract } = req.body;
    
    if (!contract) {
      return res.status(400).json({ error: "Contract is required" });
    }

    console.log(`🔍 Evaluating contract for pack: ${contract.meta.pack_id}`);
    
    const result = await compiler.evaluate(contract);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        pack_id: contract.meta.pack_id
      }
    });
    
  } catch (error) {
    console.error("❌ Evaluation error:", error);
    res.status(500).json({ 
      error: "Evaluation failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// POST /api/patch - Patch and generate final prompt
app.post("/api/patch", async (req, res) => {
  try {
    const { contract, evaluation } = req.body;
    
    if (!contract || !evaluation) {
      return res.status(400).json({ error: "Contract and evaluation are required" });
    }

    console.log(`🔧 Patching contract with ${evaluation.edits.length} improvements`);
    
    const result = await compiler.patch(contract, evaluation);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        pack_id: contract.meta.pack_id
      }
    });
    
  } catch (error) {
    console.error("❌ Patching error:", error);
    res.status(500).json({ 
      error: "Patching failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// POST /api/sabi - SABI Loop for iterative improvement
app.post("/api/sabi", async (req, res) => {
  try {
    const { original_contract, llm_response, user_feedback } = req.body;
    
    if (!original_contract || !llm_response || !user_feedback) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log(`🔄 Running SABI Loop with feedback: "${user_feedback.substring(0, 50)}..."`);
    
    const result = await compiler.sabiLoop(original_contract, llm_response, user_feedback);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        pack_id: original_contract.meta.pack_id
      }
    });
    
  } catch (error) {
    console.error("❌ SABI Loop error:", error);
    res.status(500).json({ 
      error: "SABI Loop failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// POST /api/detect-domain - Domain detection endpoint
app.post("/api/detect-domain", async (req, res) => {
  try {
    const { goal } = req.body;
    
    if (!goal) {
      return res.status(400).json({ error: "Goal is required" });
    }

    console.log(`🔍 Detecting domain for: "${goal.substring(0, 100)}..."`);
    
    const detection = detectDomainPack(goal);
    
    res.json({
      success: true,
      data: detection,
      metadata: {
        timestamp: new Date().toISOString(),
        goal_length: goal.length
      }
    });
    
  } catch (error) {
    console.error("❌ Domain detection error:", error);
    res.status(500).json({ 
      error: "Domain detection failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// 🚀 LEGACY COMPATIBILITY ENDPOINTS

// POST /generate-master-prompt - Legacy endpoint for backward compatibility
app.post("/generate-master-prompt", async (req, res) => {
  try {
    const { primaryRequest, mode = "yaffa" } = req.body;
    
    if (!primaryRequest) {
      return res.status(400).json({ error: "Primary request is required" });
    }

    console.log(`🎯 Legacy endpoint: Generating master prompt for "${primaryRequest.substring(0, 100)}..."`);
    
    const result = await compiler.runPipeline(primaryRequest, mode);
    
    res.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        mode,
        endpoint: "legacy"
      }
    });
    
  } catch (error) {
    console.error("❌ Legacy endpoint error:", error);
    res.status(500).json({ 
      error: "Failed to generate master prompt", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// 🚀 STATIC FILE SERVING

// Serve the main web interface
app.use("/", express.static("../../web/dist"));

// Serve the cartridge route (main interface)
app.get("/cartridge", (_req, res) => {
  res.sendFile("../../web/dist/index.html", { root: __dirname });
});

// 🚀 ERROR HANDLING
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error", 
    message: "Something went wrong on our end" 
  });
});

// 🚀 404 HANDLING
app.use("*", (_req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found", 
    message: "Check the API documentation for available endpoints" 
  });
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log("🚀 YAFFA Engine v2.0 - DOMAIN EMPIRE");
  console.log("🌐 Server running on http://localhost:" + PORT);
  console.log("📊 Health: http://localhost:" + PORT + "/health");
  console.log("🎯 Main Interface: http://localhost:" + PORT + "/cartridge");
  console.log("🔍 API Docs: http://localhost:" + PORT + "/api/domains");
  console.log("⚡ Ready for tunnel setup!");
  
  // Display domain pack statistics
  const stats = getDomainStats();
  console.log(`🎯 Loaded ${stats.total} domain packs across ${Object.keys(stats.categories).length} categories`);
  console.log(`🛡️  Safety levels: ${stats.safetyLevels.low} low, ${stats.safetyLevels.medium} medium, ${stats.safetyLevels.high} high, ${stats.safetyLevels.critical} critical`);
});

export default app;
