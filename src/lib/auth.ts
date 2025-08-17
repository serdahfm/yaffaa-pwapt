import { z } from "zod";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { logger } from "./logger";
import { env } from "./config";

export interface User {
  id: string;
  email: string;
  role: "user" | "admin" | "service";
  permissions: string[];
  rateLimit: {
    requests: number;
    window: number;
  };
  createdAt: Date;
  lastActive: Date;
}

export interface APIKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  permissions: string[];
  rateLimit: {
    requests: number;
    window: number;
  };
  createdAt: Date;
  lastUsed: Date;
  expiresAt?: Date;
}

export interface AuthContext {
  user?: User;
  apiKey?: APIKey;
  isAuthenticated: boolean;
  permissions: string[];
  rateLimit: {
    requests: number;
    window: number;
  };
}

// In-memory storage (replace with database in production)
const users = new Map<string, User>();
const apiKeys = new Map<string, APIKey>();
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class AuthManager {
  private static instance: AuthManager;

  private constructor() {
    this.initializeDefaultUsers();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initializeDefaultUsers(): void {
    // Create default admin user
    const adminUser: User = {
      id: "admin",
      email: "admin@yafa.com",
      role: "admin",
      permissions: ["*"],
      rateLimit: { requests: 1000, window: env.RATE_LIMIT_WINDOW },
      createdAt: new Date(),
      lastActive: new Date(),
    };
    users.set(adminUser.id, adminUser);

    // Create default service user
    const serviceUser: User = {
      id: "service",
      email: "service@yafa.com",
      role: "service",
      permissions: ["compile", "critique", "export"],
      rateLimit: { requests: 10000, window: env.RATE_LIMIT_WINDOW },
      createdAt: new Date(),
      lastActive: new Date(),
    };
    users.set(serviceUser.id, serviceUser);

    // Create default API key for service user
    const serviceKey: APIKey = {
      id: "service-key",
      userId: "service",
      key: this.generateAPIKey(),
      name: "Service API Key",
      permissions: ["compile", "critique", "export"],
      rateLimit: { requests: 10000, window: env.RATE_LIMIT_WINDOW },
      createdAt: new Date(),
      lastUsed: new Date(),
    };
    apiKeys.set(serviceKey.key, serviceKey);

    logger.info("Default users and API keys initialized");
  }

  private generateAPIKey(): string {
    return `yafa_${crypto.randomBytes(32).toString("hex")}`;
  }

  async createUser(userData: Omit<User, "id" | "createdAt" | "lastActive">): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      ...userData,
      id,
      createdAt: new Date(),
      lastActive: new Date(),
    };

    users.set(id, user);
    logger.info({ userId: id, email: user.email }, "User created");
    return user;
  }

  async createAPIKey(userId: string, name: string, permissions: string[]): Promise<APIKey> {
    const user = users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const key = this.generateAPIKey();
    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      userId,
      key,
      name,
      permissions,
      rateLimit: user.rateLimit,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    apiKeys.set(key, apiKey);
    logger.info({ apiKeyId: apiKey.id, userId }, "API key created");
    return apiKey;
  }

  async validateToken(token: string): Promise<AuthContext | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      const user = users.get(decoded.userId);
      
      if (!user) {
        return null;
      }

      user.lastActive = new Date();
      return {
        user,
        isAuthenticated: true,
        permissions: user.permissions,
        rateLimit: user.rateLimit,
      };
    } catch (error) {
      logger.warn({ error }, "Invalid JWT token");
      return null;
    }
  }

  async validateAPIKey(key: string): Promise<AuthContext | null> {
    const apiKey = apiKeys.get(key);
    if (!apiKey) {
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKeys.delete(key);
      return null;
    }

    const user = users.get(apiKey.userId);
    if (!user) {
      return null;
    }

    apiKey.lastUsed = new Date();
    user.lastActive = new Date();

    return {
      apiKey,
      user,
      isAuthenticated: true,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
    };
  }

  async checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + window });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  async checkPermission(context: AuthContext, permission: string): Promise<boolean> {
    if (!context.isAuthenticated) {
      return false;
    }

    if (context.permissions.includes("*")) {
      return true;
    }

    return context.permissions.includes(permission);
  }

  generateToken(userId: string, expiresIn: string = "24h"): string {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn });
  }

  async getUser(userId: string): Promise<User | null> {
    return users.get(userId) || null;
  }

  async getAPIKey(key: string): Promise<APIKey | null> {
    return apiKeys.get(key) || null;
  }

  async revokeAPIKey(key: string): Promise<boolean> {
    return apiKeys.delete(key);
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const user = users.get(userId);
    if (!user) {
      return false;
    }

    user.permissions = permissions;
    logger.info({ userId, permissions }, "User permissions updated");
    return true;
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalAPIKeys: number;
    activeUsers: number;
  }> {
    const now = Date.now();
    const activeThreshold = 24 * 60 * 60 * 1000; // 24 hours

    let activeUsers = 0;
    for (const user of users.values()) {
      if (now - user.lastActive.getTime() < activeThreshold) {
        activeUsers++;
      }
    }

    return {
      totalUsers: users.size,
      totalAPIKeys: apiKeys.size,
      activeUsers,
    };
  }
}

export const authManager = AuthManager.getInstance();

// Middleware for Express
export const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    let context: AuthContext | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      context = await authManager.validateToken(token);
    } else if (authHeader?.startsWith("Key ")) {
      const key = authHeader.substring(4);
      context = await authManager.validateAPIKey(key);
    }

    if (!context) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.auth = context;
    next();
  } catch (error) {
    logger.error({ error }, "Authentication error");
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const requirePermission = (permission: string) => {
  return async (req: any, res: any, next: any) => {
    const context = req.auth as AuthContext;
    
    if (!context) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasPermission = await authManager.checkPermission(context, permission);
    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

export const rateLimit = async (req: any, res: any, next: any) => {
  const context = req.auth as AuthContext;
  
  if (!context) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const identifier = context.user?.id || context.apiKey?.id || req.ip;
  const { requests, window } = context.rateLimit;

  const allowed = await authManager.checkRateLimit(identifier, requests, window);
  if (!allowed) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  next();
};
