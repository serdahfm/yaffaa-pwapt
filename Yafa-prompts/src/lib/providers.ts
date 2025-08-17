import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { logger } from "./logger.js";
import { env } from "./config.js";

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface GenerationRequest {
  system: string;
  user: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  seed?: number;
  stop?: string[];
}

export interface GenerationResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  cost: number;
}

export interface Provider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  getModels(): string[];
  calculateCost(tokens: number, model: string): number;
}

export class OpenAIProvider implements Provider {
  public name = "openai";
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        temperature: request.temperature,
        top_p: request.topP,
        max_tokens: request.maxTokens,
        seed: request.seed,
        stop: request.stop,
      });

      const content = response.choices[0]?.message?.content || "";
      const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      return {
        content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        model: request.model,
        cost: this.calculateCost(usage.total_tokens, request.model),
      };
    } catch (error) {
      logger.error("OpenAI generation failed", { error, provider: this.name, model: request.model });
      throw error;
    }
  }

  getModels(): string[] {
    return [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
    ];
  }

  calculateCost(tokens: number, model: string): number {
    const rates: Record<string, { input: number; output: number }> = {
      "gpt-4o": { input: 0.000005, output: 0.000015 },
      "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
      "gpt-4-turbo": { input: 0.00001, output: 0.00003 },
      "gpt-4": { input: 0.00003, output: 0.00006 },
      "gpt-3.5-turbo": { input: 0.0000015, output: 0.000002 },
    };

    const rate = rates[model] || rates["gpt-4o-mini"];
    return (tokens * rate.input) / 1000; // Convert to dollars
  }
}

export class AnthropicProvider implements Provider {
  public name = "anthropic";
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    try {
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: request.topP,
        system: request.system,
        messages: [{ role: "user", content: request.user }],
      });

      const content = response.content[0]?.text || "";
      const usage = response.usage || { input_tokens: 0, output_tokens: 0 };

      return {
        content,
        usage: {
          promptTokens: usage.input_tokens,
          completionTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens,
        },
        model: request.model,
        cost: this.calculateCost(usage.input_tokens + usage.output_tokens, request.model),
      };
    } catch (error) {
      logger.error("Anthropic generation failed", { error, provider: this.name, model: request.model });
      throw error;
    }
  }

  getModels(): string[] {
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];
  }

  calculateCost(tokens: number, model: string): number {
    const rates: Record<string, { input: number; output: number }> = {
      "claude-3-5-sonnet-20241022": { input: 0.000003, output: 0.000015 },
      "claude-3-5-haiku-20241022": { input: 0.00000025, output: 0.00000125 },
      "claude-3-opus-20240229": { input: 0.000015, output: 0.000075 },
      "claude-3-sonnet-20240229": { input: 0.000003, output: 0.000015 },
      "claude-3-haiku-20240307": { input: 0.00000025, output: 0.00000125 },
    };

    const rate = rates[model] || rates["claude-3-5-haiku-20241022"];
    return (tokens * rate.input) / 1000; // Convert to dollars
  }
}

export class LocalProvider implements Provider {
  public name = "local";

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    // Simulate local generation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockContent = `This is a mock response from the local provider for: ${request.user.substring(0, 50)}...`;
    
    return {
      content: mockContent,
      usage: {
        promptTokens: request.system.length + request.user.length,
        completionTokens: mockContent.length,
        totalTokens: request.system.length + request.user.length + mockContent.length,
      },
      model: request.model,
      cost: 0,
    };
  }

  getModels(): string[] {
    return ["local-mock", "local-test"];
  }

  calculateCost(): number {
    return 0;
  }
}

export class ProviderRegistry {
  private providers: Map<string, Provider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (env.OPENAI_API_KEY) {
      this.providers.set("openai", new OpenAIProvider({
        name: "openai",
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_ORG_ID ? `https://api.openai.com/v1` : undefined,
      }));
    }

    if (env.ANTHROPIC_API_KEY) {
      this.providers.set("anthropic", new AnthropicProvider({
        name: "anthropic",
        apiKey: env.ANTHROPIC_API_KEY,
      }));
    }

    // Always add local provider as fallback
    this.providers.set("local", new LocalProvider());
  }

  getProvider(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  getDefaultProvider(): Provider {
    const defaultProvider = this.providers.get(env.DEFAULT_PROVIDER);
    if (defaultProvider) {
      return defaultProvider;
    }

    // Fallback to first available provider
    const firstProvider = Array.from(this.providers.values())[0];
    if (firstProvider) {
      return firstProvider;
    }

    // Ultimate fallback to local
    return new LocalProvider();
  }

  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  async generate(request: GenerationRequest, providerName?: string): Promise<GenerationResponse> {
    const provider = providerName ? this.getProvider(providerName) : this.getDefaultProvider();
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    return await provider.generate(request);
  }
}

export const providerRegistry = new ProviderRegistry();
