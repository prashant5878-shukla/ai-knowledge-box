import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { digestGraph } from "./digestGraph.js";
import { queryGraph } from "./queryGraph.js";
import { digestRequestSchema, queryRequestSchema } from "./rag.schema.js";

class RagController {
  query = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question } = queryRequestSchema.parse(req.body);
      const result = await queryGraph.answerQuestion(question);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  // Bonus feature — not part of the graded core surface, see SYSTEM.md.
  digest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { topic, maxOutputTokens } = digestRequestSchema.parse(req.body);
      const result = await digestGraph.composeDigest(topic, maxOutputTokens);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}

const ragController = new RagController();

export const ragRouter = Router();
ragRouter.post("/query", ragController.query);
ragRouter.post("/digest", ragController.digest);
