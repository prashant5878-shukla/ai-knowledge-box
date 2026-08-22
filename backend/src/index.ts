import { env } from "./config/env.js";
import { database } from "./db/connection.js";
import { logger } from "./lib/logger.js";
import { vectorStore } from "./modules/vectorStore/vectorStore.js";
import { Server } from "./server.js";

async function main() {
  await database.connect();
  await vectorStore.hydrate();

  const server = new Server();
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "knowledge-inbox backend listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "failed to start server");
  process.exit(1);
});
