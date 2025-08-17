import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import prometheusMiddleware from "express-prometheus-middleware";
import { config } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { routes } from "./routes.js";

// Generate request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      logger: any;
      requestId: string;
    }
  }
}

export function createServer(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS middleware
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));

  // Body parsing
  app.use(express.json({ limit: config.storage.maxFileSize }));
  app.use(express.urlencoded({ extended: true, limit: config.storage.maxFileSize }));

  // Compression
  app.use(compression());

  // Logging
  app.use(morgan("combined", {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));

  // Rate limiting
  const globalRateLimit = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: "Too many requests from this IP",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalRateLimit);

  // Metrics middleware
  if (config.metrics.enabled) {
    app.use(prometheusMiddleware({
      metricsPath: "/metrics",
      collectDefaultMetrics: true,
      requestDurationBuckets: [0.1, 0.5, 1, 2, 5],
    }));
  }

  // Request ID and logging middleware
  app.use((req, res, next) => {
    const requestId = req.headers["x-request-id"] as string || generateRequestId();
    req.requestId = requestId;
    req.logger = logger.child({ requestId });
    
    res.setHeader("X-Request-ID", requestId);
    next();
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "4.0.0",
      environment: config.server.environment,
    });
  });

  // Swagger documentation
  if (config.swagger.enabled) {
    const swaggerOptions = {
      definition: {
        openapi: "3.0.0",
        info: {
          title: config.swagger.title,
          version: config.swagger.version,
          description: "YAFA Prompt Orchestration Engine API",
        },
        servers: [
          {
            url: `http://${config.server.host}:${config.server.port}`,
            description: "Development server",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
            apiKey: {
              type: "apiKey",
              in: "header",
              name: "X-API-Key",
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
          {
            apiKey: [],
          },
        ],
      },
      apis: ["./src/api/routes.ts"],
    };

    const specs = swaggerJsdoc(swaggerOptions);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
    app.get("/api-docs.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(specs);
    });
  }

  // API routes
  app.use("/api", routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
    });
  });

  // Error handler
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = req.requestId || "unknown";
    
    logger.error("Unhandled error", {
      error: error.message,
      stack: error.stack,
      requestId,
      method: req.method,
      path: req.path,
    });

    res.status(error.status || 500).json({
      error: "Internal Server Error",
      message: config.server.isProduction ? "An unexpected error occurred" : error.message,
      requestId,
      ...(config.server.isDevelopment && { stack: error.stack }),
    });
  });

  return app;
}
