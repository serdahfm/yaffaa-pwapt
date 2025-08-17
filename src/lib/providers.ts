import { logger } from "./logger.js";
import { GenerationRequest, GenerationResponse, ProviderConfig } from "./validators.js";

// Abstract provider interface
export interface Provider {
  name: string;
  config: ProviderConfig;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  isAvailable(): boolean;
}

// OpenAI provider implementation
export class OpenAIProvider implements Provider {
  public name = "openai";
  public config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // This would use the actual OpenAI SDK
      // For now, return a mock response
      logger.info("Generating with OpenAI", { model: this.config.model, maxTokens: request.maxTokens });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        content: "This is a mock response from OpenAI. In production, this would be the actual LLM response.",
        model: this.config.model || "gpt-4o-mini",
        usage: {
          promptTokens: request.system.length + request.user.length,
          completionTokens: 50,
          totalTokens: request.system.length + request.user.length + 50,
        },
        cost: 0.001, // Mock cost
        finishReason: "stop",
        metadata: {
          provider: "openai",
          model: this.config.model,
          temperature: request.temperature,
          topP: request.topP,
          maxTokens: request.maxTokens,
        },
      };
    } catch (error) {
      logger.error("OpenAI generation failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }
}

// Anthropic provider implementation
export class AnthropicProvider implements Provider {
  public name = "anthropic";
  public config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      // This would use the actual Anthropic SDK
      // For now, return a mock response
      logger.info("Generating with Anthropic", { model: this.config.model, maxTokens: request.maxTokens });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        content: "This is a mock response from Anthropic. In production, this would be the actual LLM response.",
        model: this.config.model || "claude-3-haiku-20240307",
        usage: {
          promptTokens: request.system.length + request.user.length,
          completionTokens: 45,
          totalTokens: request.system.length + request.user.length + 45,
        },
        cost: 0.0008, // Mock cost
        finishReason: "end_turn",
        metadata: {
          provider: "anthropic",
          model: this.config.model,
          temperature: request.temperature,
          topP: request.topP,
          maxTokens: request.maxTokens,
        },
      };
    } catch (error) {
      logger.error("Anthropic generation failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.length > 0);
  }
}

// Local provider implementation (for testing/development)
export class LocalProvider implements Provider {
  public name = "local";
  public config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      logger.info("Generating with local provider", { maxTokens: request.maxTokens });
      
      // Simulate local processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        content: "This is a mock response from the local provider. In production, this would use a local LLM model.",
        model: "local-mock",
        usage: {
          promptTokens: request.system.length + request.user.length,
          completionTokens: 40,
          totalTokens: request.system.length + request.user.length + 40,
        },
        cost: 0, // No cost for local
        finishReason: "stop",
        metadata: {
          provider: "local",
          model: "local-mock",
          temperature: request.temperature,
          topP: request.topP,
          maxTokens: request.maxTokens,
        },
      };
    } catch (error) {
      logger.error("Local generation failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  isAvailable(): boolean {
    return true; // Local provider is always available
  }
}

// Provider registry for managing multiple providers
export class ProviderRegistry {
  private providers: Map<string, Provider> = new Map();
  private defaultProvider: string = "openai";

  constructor() {
    // Initialize with available providers
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Check environment variables and initialize providers
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (openaiKey) {
      const openaiProvider = new OpenAIProvider({
        name: "openai",
        apiKey: openaiKey,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        timeout: parseInt(process.env.OPENAI_TIMEOUT || "30000"),
        maxRetries: 3,
        retryDelay: 1000,
      });
      this.register("openai", openaiProvider);
    }

    if (anthropicKey) {
      const anthropicProvider = new AnthropicProvider({
        name: "anthropic",
        apiKey: anthropicKey,
        model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
        timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || "30000"),
        maxRetries: 3,
        retryDelay: 1000,
      });
      this.register("anthropic", anthropicProvider);
    }

    // Always register local provider
    const localProvider = new LocalProvider({
      name: "local",
      timeout: 30000,
      maxRetries: 1,
      retryDelay: 0,
    });
    this.register("local", localProvider);

    logger.info("Provider registry initialized", { 
      providers: Array.from(this.providers.keys()),
      defaultProvider: this.defaultProvider 
    });
  }

  register(name: string, provider: Provider): void {
    this.providers.set(name, provider);
    logger.info("Provider registered", { name, available: provider.isAvailable() });
  }

  get(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  getDefault(): Provider {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider '${this.defaultProvider}' not found`);
    }
    return provider;
  }

  getAll(): Provider[] {
    return Array.from(this.providers.values());
  }

  getAvailable(): Provider[] {
    return this.getAll().filter(provider => provider.isAvailable());
  }

  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.defaultProvider = name;
    logger.info("Default provider changed", { newDefault: name });
  }

  async generate(request: GenerationRequest, providerName?: string): Promise<GenerationResponse> {
    const provider = providerName ? this.get(providerName) : this.getDefault();
    
    if (!provider) {
      throw new Error(`Provider '${providerName || this.defaultProvider}' not found`);
    }

    if (!provider.isAvailable()) {
      throw new Error(`Provider '${provider.name}' is not available`);
    }

    return await provider.generate(request);
  }

  getStats(): {
    total: number;
    available: number;
    default: string;
    providers: Array<{ name: string; available: boolean; config: ProviderConfig }>;
  } {
    const providers = this.getAll();
    return {
      total: providers.length,
      available: providers.filter(p => p.isAvailable()).length,
      default: this.defaultProvider,
      providers: providers.map(p => ({
        name: p.name,
        available: p.isAvailable(),
        config: p.config,
      })),
    };
  }
}

// Export singleton instance
export const providerRegistry = new ProviderRegistry();
