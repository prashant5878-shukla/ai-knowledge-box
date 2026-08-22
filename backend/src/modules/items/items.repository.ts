import { ChunkModel, ItemModel } from "./items.model.js";
import type { ChunkDocument, ItemDocument } from "./items.types.js";

/** Only class in the app that imports items.model.ts directly — everything else
 * (ingestion, rag, vectorStore) goes through these methods instead of the Mongoose
 * models, so the query logic for items/chunks lives in exactly one place. */
class ItemsRepository {
  async insertItem(doc: ItemDocument): Promise<void> {
    await ItemModel.create(doc);
  }

  async insertChunks(chunks: ChunkDocument[]): Promise<void> {
    if (chunks.length === 0) return;
    await ChunkModel.insertMany(chunks);
  }

  async listItems(): Promise<ItemDocument[]> {
    return ItemModel.find().sort({ createdAt: -1 }).lean();
  }

  async findItemsByIds(ids: string[]): Promise<Map<string, ItemDocument>> {
    const docs = await ItemModel.find({ _id: { $in: ids } }).lean();
    return new Map(docs.map((doc) => [doc._id, doc]));
  }

  async listAllChunks(): Promise<ChunkDocument[]> {
    return ChunkModel.find().lean();
  }

  async countItems(): Promise<number> {
    return ItemModel.countDocuments();
  }

  async findItemById(id: string): Promise<ItemDocument | null> {
    return ItemModel.findById(id).lean();
  }

  async deleteItem(id: string): Promise<void> {
    await ItemModel.deleteOne({ _id: id });
    await ChunkModel.deleteMany({ itemId: id });
  }
}

export const itemsRepository = new ItemsRepository();
