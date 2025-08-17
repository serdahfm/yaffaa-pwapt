import { Cartridge, CartridgeRegistry, validateSlots } from "./cartridge.js";
import { CompileInput, CompileOutput, compileOutputSchema, RunManifest } from "../lib/validators.js";
import { createRequestLogger } from "../lib/logger.js";
import { cacheManager } from "../lib/cache.js";
import { jobQueue } from "../lib/queue.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import fs from "fs-extra";
import path from "path";

export class Compiler {
  private registry: CartridgeRegistry;
  private runManifests: Map<string, RunManifest> = new Map();
  private engineVersion = "4.0.0";

  constructor(registry: CartridgeRegistry) {
    this.registry = registry;
  }

  async compile(input: CompileInput): Promise<CompileOutput> {
    const startTime = Date.now();
    const requestLogger = createRequestLogger(input.requestId);
    
    requestLogger.info({ goal: input.goal, yafaOn: input.yafaOn }, "Starting compilation");

    try {
      // Select cartridge
      const cartridge = this.selectCartridge(input.goal);
      requestLogger.debug({ goal: input.goal, cartridgeId: cartridge.id, cartridgeVersion: cartridge.version }, "Selected cartridge");

      // Check cache first (unless bypassed)
      if (!input.bypassCache) {
        const cacheKey = { 
          goal: input.goal, 
          slots: input.slots, 
          yafaOn: input.yafaOn, 
          cartridgeId: cartridge.id, 
          cartridgeVersion: cartridge.version 
        };
        const cached = await cacheManager.get<CompileOutput>(cacheKey);
        if (cached) {
          requestLogger.info({ requestId: input.requestId, cartridgeId: cartridge.id }, "Using cached compilation result");
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              requestId: input.requestId,
              cacheHit: true,
            },
          };
        }
      }

      // Validate slots
      const slotValidation = validateSlots(cartridge, input.slots);
      if (!slotValidation.valid) {
        requestLogger.warn({ requestId: input.requestId, cartridgeId: cartridge.id, errors: slotValidation.errors }, "Slot validation failed");
        return {
          status: "ERROR",
          packId: cartridge.id,
          metadata: this.createMetadata(input, cartridge, startTime, false),
        };
      }

      // Check for missing required slots
      if (slotValidation.missing.length > 0) {
        requestLogger.info({ requestId: input.requestId, cartridgeId: cartridge.id, missing: slotValidation.missing }, "Missing required slots");
        return {
          status: "NEEDED",
          packId: cartridge.id,
          questions: slotValidation.missing.map((k) => cartridge.slotQuestions[k] || `Provide: ${k}`),
          metadata: this.createMetadata(input, cartridge, startTime, false),
        };
      }

      // Generate final output
      const compileTime = Date.now() - startTime;
      const output: CompileOutput = {
        status: "OK",
        packId: cartridge.id,
        final: {
          system: cartridge.prompts.system,
          user: this.buildUserPrompt(input, cartridge),
          critic: cartridge.prompts.critic,
          determinism: cartridge.determinism,
        },
        metadata: this.createMetadata(input, cartridge, startTime, false),
      };

      // Validate output
      const validatedOutput = compileOutputSchema.parse(output);

      // Cache the result
      if (!input.bypassCache) {
        const cacheKey = { 
          goal: input.goal, 
          slots: input.slots, 
          yafaOn: input.yafaOn, 
          cartridgeId: cartridge.id, 
          cartridgeVersion: cartridge.version 
        };
        await cacheManager.set(cacheKey, validatedOutput, { 
          ttl: 3600000, // 1 hour
          tags: [cartridge.id, "compile", input.requestId]
        });
      }

      // Create and store run manifest
      const runManifest = this.createRunManifest(input, validatedOutput, cartridge, startTime);
      this.runManifests.set(runManifest.id, runManifest);

      // Store manifest to disk for persistence
      await this.persistRunManifest(runManifest);

      requestLogger.info({ 
        requestId: input.requestId, 
        cartridgeId: cartridge.id, 
        compileTime, 
        status: "OK" 
      }, "Compilation completed successfully");

      return validatedOutput;

    } catch (error) {
      const compileTime = Date.now() - startTime;
      requestLogger.error({ error, requestId: input.requestId, compileTime }, "Compilation failed");

      return {
        status: "ERROR",
        packId: "unknown",
        metadata: {
          requestId: input.requestId,
          compileTime,
          cartridgeId: "unknown",
          cartridgeVersion: "unknown",
          provider: "unknown",
          model: "unknown",
          cost: 0,
          cacheHit: false,
          provenance: {
            commitHash: "unknown",
            timestamp: new Date().toISOString(),
            runId: crypto.randomUUID(),
            engineVersion: this.engineVersion,
            cartridgeChecksum: "unknown",
          },
        },
      };
    }
  }

  async compileAsync(input: CompileInput): Promise<{ jobId: string; status: "queued" }> {
    const jobId = await jobQueue.addJob("compile", input, {
      requestId: input.requestId,
      cartridgeId: "unknown", // Will be determined during job execution
    });

    return { jobId, status: "queued" as const };
  }

  async getJobStatus(jobId: string): Promise<any> {
    return await jobQueue.getJobStatus(jobId);
  }

  async getRunManifest(runId: string): Promise<RunManifest | null> {
    return this.runManifests.get(runId) || null;
  }

  async getAllRunManifests(): Promise<RunManifest[]> {
    return Array.from(this.runManifests.values());
  }

  async exportRunManifests(format: "json" | "csv" | "zip" = "json"): Promise<string | Buffer> {
    const manifests = Array.from(this.runManifests.values());
    
    switch (format) {
      case "json":
        return JSON.stringify(manifests, null, 2);
      case "csv":
        return this.convertToCSV(manifests);
      case "zip":
        return await this.createZipArchive(manifests);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private selectCartridge(goal: string): Cartridge {
    const candidates = this.registry.getAll();
    let best: { c: Cartridge; score: number } | null = null;

    for (const c of candidates) {
      const result = this.detectCartridge(c, goal);
      const score = result.score;
      
      if (!best || score > best.score) {
        best = { c, score };
      }
    }

    if (!best) {
      throw new Error("No compatible cartridges found");
    }

    return best.c;
  }

  private detectCartridge(cartridge: Cartridge, goal: string): { score: number; confidence: number } {
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

    return {
      score,
      confidence: Math.min(score / cartridge.keywords.length, 1),
    };
  }

  private buildUserPrompt(input: CompileInput, cartridge: Cartridge): string {
    let prompt = cartridge.prompts.user;
    
    // Replace slot placeholders
    for (const [slot, value] of Object.entries(input.slots)) {
      const placeholder = `{{${slot}}}`;
      prompt = prompt.replace(new RegExp(placeholder, "g"), String(value));
    }
    
    // Add YAFA mode indicator
    if (input.yafaOn) {
      prompt += "\n\nYAFA MODE: High precision, deterministic output required.";
    }
    
    return prompt;
  }

  private createMetadata(input: CompileInput, cartridge: Cartridge, startTime: number, cacheHit: boolean) {
    return {
      requestId: input.requestId,
      compileTime: Date.now() - startTime,
      cartridgeId: cartridge.id,
      cartridgeVersion: cartridge.version,
      provider: input.provider || "default",
      model: input.model || "default",
      cost: 0, // Will be updated with actual cost
      cacheHit,
      provenance: {
        commitHash: this.getCommitHash(),
        timestamp: new Date().toISOString(),
        runId: crypto.randomUUID(),
        engineVersion: this.engineVersion,
        cartridgeChecksum: this.calculateCartridgeChecksum(cartridge),
      },
    };
  }

  private createRunManifest(input: CompileInput, output: CompileOutput, cartridge: Cartridge, startTime: number): RunManifest {
    return {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      userId: input.userId,
      timestamp: new Date().toISOString(),
      input,
      output,
      cartridge: {
        id: cartridge.id,
        version: cartridge.version,
        checksum: this.calculateCartridgeChecksum(cartridge),
      },
      provider: {
        name: output.metadata.provider,
        model: output.metadata.model,
        parameters: {
          temperature: output.final?.determinism.temperature || 0.7,
          topP: output.final?.determinism.topP || 1,
          seed: output.final?.determinism.seed,
          maxTokens: output.final?.determinism.maxTokens || 1000,
        },
      },
      performance: {
        compileTime: output.metadata.compileTime,
        totalTime: Date.now() - startTime,
        cacheHit: output.metadata.cacheHit,
      },
      cost: {
        amount: output.metadata.cost,
        currency: "USD",
        tokens: {
          input: 0, // Will be updated with actual token counts
          output: 0,
          total: 0,
        },
      },
    };
  }

  private async persistRunManifest(manifest: RunManifest): Promise<void> {
    try {
      const manifestsDir = path.join(process.cwd(), "artifacts", "manifests");
      await fs.ensureDir(manifestsDir);
      
      const filename = `${manifest.id}.json`;
      const filepath = path.join(manifestsDir, filename);
      
      await fs.writeJson(filepath, manifest, { spaces: 2 });
    } catch (error) {
      console.error("Failed to persist run manifest:", error);
    }
  }

  private getCommitHash(): string {
    try {
      // This would read from .git/HEAD or environment variable
      return process.env.GIT_COMMIT_HASH || "unknown";
    } catch {
      return "unknown";
    }
  }

  private calculateCartridgeChecksum(cartridge: Cartridge): string {
    const content = JSON.stringify({
      id: cartridge.id,
      version: cartridge.version,
      prompts: cartridge.prompts,
      determinism: cartridge.determinism,
    });
    
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private convertToCSV(manifests: RunManifest[]): string {
    if (manifests.length === 0) return "";
    
    const headers = [
      "ID", "Request ID", "User ID", "Timestamp", "Cartridge ID", "Cartridge Version",
      "Provider", "Model", "Status", "Compile Time", "Cost", "Cache Hit"
    ];
    
    const rows = manifests.map(m => [
      m.id,
      m.requestId,
      m.userId || "",
      m.timestamp,
      m.cartridge.id,
      m.cartridge.version,
      m.provider.name,
      m.provider.model,
      m.output.status,
      m.performance.compileTime,
      m.cost.amount,
      m.performance.cacheHit
    ]);
    
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  }

  private async createZipArchive(manifests: RunManifest[]): Promise<Buffer> {
    // This would use the archiver library to create a ZIP file
    // For now, return a mock buffer
    return Buffer.from("ZIP archive would be created here");
  }
}
