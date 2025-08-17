// Main application entry point
import { createServer } from "./api/server.js";
import { env } from "./lib/config.js";
import { logger } from "./lib/logger.js";

async function main() {
  const app = createServer();
  app.listen(env.PORT, () => {
    logger.info("YAFA Prompt Orchestration Engine started", { port: env.PORT, env: env.NODE_ENV });
  });
}

main().catch((err) => {
  logger.error("Fatal error during startup", { err });
  process.exit(1);
});
