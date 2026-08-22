import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { vectorStore } from "../vectorStore/vectorStore.js";
import { itemsRepository } from "./items.repository.js";
import { ItemMapper } from "./items.types.js";

/** Handles GET/DELETE /items. Methods are arrow function class properties (not
 * prototype methods) so `itemsRouter.get("/items", itemsController.list)` keeps
 * `this` bound to the instance without an extra `.bind()` at the call site. */
class ItemsController {
  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await itemsRepository.listItems();
      res.status(200).json({ data: items.map(ItemMapper.toSummary) });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await itemsRepository.findItemById(id);
      if (!item) throw new NotFoundError(`No item with id "${id}"`);

      await itemsRepository.deleteItem(id);
      vectorStore.removeItem(id);

      logger.info({ itemId: id }, "item deleted");
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}

const itemsController = new ItemsController();

export const itemsRouter = Router();
itemsRouter.get("/items", itemsController.list);
itemsRouter.delete("/items/:id", itemsController.delete);
