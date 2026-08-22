import { Schema, model } from "mongoose";
import type { ChunkDocument, ItemDocument, ItemType } from "./items.types.js";

// Mongoose schemas, kept next to the plain ItemDocument/ChunkDocument interfaces in
// items.types.ts (those interfaces stay the shared shape used across services/routes;
// these schemas just describe how that shape is validated/persisted). IDs are our own
// nanoids (see ingestion.service.ts), not Mongo ObjectIds, so `_id` is typed as String.
const itemSchema = new Schema<ItemDocument>(
  {
    _id: { type: String, required: true },
    type: { type: String, enum: ["note", "url"] satisfies ItemType[], required: true },
    title: { type: String, required: true },
    sourceUrl: { type: String },
    rawContent: { type: String, required: true },
    createdAt: { type: String, required: true },
    chunkCount: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);
itemSchema.index({ createdAt: -1 });

const chunkSchema = new Schema<ChunkDocument>(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);
chunkSchema.index({ itemId: 1 });

export const ItemModel = model<ItemDocument>("Item", itemSchema, "items");
export const ChunkModel = model<ChunkDocument>("Chunk", chunkSchema, "chunks");
