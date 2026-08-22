import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { ItemMapper } from "../items/items.types.js";
import { ingestRequestSchema } from "./ingestion.schema.js";
import { ingestionService } from "./ingestion.service.js";

class IngestionController {
  ingest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = ingestRequestSchema.parse(req.body);
      const item = await ingestionService.ingestItem(input);
      res.status(201).json({ data: ItemMapper.toSummary(item) });
    } catch (err) {
      next(err);
    }
  };
}

const ingestionController = new IngestionController();

export const ingestionRouter = Router();
ingestionRouter.post("/ingest", ingestionController.ingest);
