import { ITEM_PREVIEW_LENGTH } from "../../config/constants.js";

export type ItemType = "note" | "url";

export interface ItemDocument {
  _id: string;
  type: ItemType;
  title: string;
  sourceUrl?: string;
  rawContent: string;
  createdAt: string;
  chunkCount: number;
}

export interface ChunkDocument {
  _id: string;
  itemId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  createdAt: string;
}

export interface ItemSummary {
  id: string;
  type: ItemType;
  title: string;
  sourceUrl?: string;
  createdAt: string;
  preview: string;
  chunkCount: number;
}

/** Converts stored documents into the shape returned over the API. Stateless, so its
 * one method is static rather than requiring an instance to be constructed first. */
export class ItemMapper {
  static toSummary(doc: ItemDocument): ItemSummary {
    return {
      id: doc._id,
      type: doc.type,
      title: doc.title,
      sourceUrl: doc.sourceUrl,
      createdAt: doc.createdAt,
      preview: doc.rawContent.slice(0, ITEM_PREVIEW_LENGTH),
      chunkCount: doc.chunkCount,
    };
  }
}
