import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./lib/migrations";
import { seedAdminCredentials } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  // 1. Ensure schema is up-to-date (idempotent, safe to run every boot)
  await runMigrations();

  // 2. Seed default admin credentials if none exist
  await seedAdminCredentials();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
