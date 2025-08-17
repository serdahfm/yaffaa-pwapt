#!/usr/bin/env node

import { createServer } from "./api/server.js";
import { logger } from "./lib/logger.js";
import { config } from "./lib/config.js";

async function main() {
  try {
    // Create the Express server
    const app = createServer();
    
    // Start the server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info("YAFA Prompt Orchestration Engine started", {
        host: config.server.host,
        port: config.server.port,
        environment: config.server.environment,
        version: "4.0.0",
        features: {
          caching: true,
          jobQueue: true,
          metrics: config.metrics.enabled,
          swagger: config.swagger.enabled,
          security: true,
          provenance: true,
        },
      });
      
      // Log available endpoints
      logger.info("Available endpoints", {
        health: `http://${config.server.host}:${config.server.port}/health`,
        api: `http://${config.server.host}:${config.server.port}/api`,
        ...(config.metrics.enabled && { metrics: `http://${config.server.host}:${config.server.port}/metrics` }),
        ...(config.swagger.enabled && { docs: `http://${config.server.host}:${config.server.port}/api-docs` }),
      });
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      server.close((err) => {
        if (err) {
          logger.error("Error during server shutdown", { error: err.message });
          process.exit(1);
        }
        
        logger.info("Server closed successfully");
        process.exit(0);
      });
      
      // Force exit after 30 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 30000);
    };
    
    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", { error: error.message, stack: error.stack });
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled promise rejection", { reason, promise });
      process.exit(1);
    });
    
    // Handle process warnings
    process.on("warning", (warning) => {
      logger.warn("Process warning", { 
        name: warning.name, 
        message: warning.message, 
        stack: warning.stack 
      });
    });
    
  } catch (error) {
    logger.error("Failed to start YAFA Engine", { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
