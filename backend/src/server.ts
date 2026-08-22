import cors from "cors";
import express, { type Express } from "express";
import { pinoHttp } from "pino-http";
import { ErrorHandler } from "./lib/errors.js";
import { logger } from "./lib/logger.js";
import { RequestContextMiddleware } from "./lib/requestContext.js";
import { ingestionRouter } from "./modules/ingestion/ingestion.routes.js";
import { itemsRouter } from "./modules/items/items.routes.js";
import { ragRouter } from "./modules/rag/rag.routes.js";
import { vectorStore } from "./modules/vectorStore/vectorStore.js";

/** Owns the Express app: middleware, routes, and the error handler, in that order.
 * `app` is exposed read-only via `getApp()` so callers (index.ts, tests) can pass it
 * to `.listen()` or a test HTTP client without this class also owning the listening
 * socket — keeping "build the app" and "run the app" as separate concerns. */
export class Server {
  private app: Express;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  getApp(): Express {
    return this.app;
  }

  listen(port: number, onListening: () => void): void {
    this.app.listen(port, onListening);
  }

  private configureMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(RequestContextMiddleware.attach);
    this.app.use(
      pinoHttp({
        logger,
        customProps: (req, res) => ({ requestId: res.locals.requestId }),
      }),
    );
  }

  private configureRoutes(): void {
    this.app.get("/health", (_req, res) => {
      res.status(200).json({ data: { status: "ok", chunksIndexed: vectorStore.size() } });
    });

    this.app.use(itemsRouter);
    this.app.use(ingestionRouter);
    this.app.use(ragRouter);

    this.app.use((req, res) => {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(ErrorHandler.handle);
  }
}
