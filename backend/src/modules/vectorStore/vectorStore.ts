import { itemsRepository } from "../items/items.repository.js";
import type { ChunkDocument } from "../items/items.types.js";
import { logger } from "../../lib/logger.js";

interface IndexedChunk {
  id: string;
  itemId: string;
  text: string;
  embedding: number[];
}

export interface SimilarityMatch {
  id: string;
  itemId: string;
  text: string;
  score: number;
}

/**
 * Single-user, small-corpus assumption: the whole embedding matrix fits comfortably
 * in process memory, so a linear cosine-similarity scan is simpler and fast enough
 * (single-digit ms for thousands of chunks) compared to standing up a dedicated ANN
 * index. MongoDB remains the source of truth (via ItemsRepository); this class is
 * purely a read-through cache — rebuilt from Mongo at boot (`hydrate`) and kept in
 * sync on writes (`addChunks`) and deletes (`removeItem`). See SYSTEM.md for the
 * scale tradeoff. One instance for the process (exported singleton below), since
 * there is exactly one in-memory index per Node process.
 */
class VectorStore {
  private index: IndexedChunk[] = [];

  async hydrate(): Promise<void> {
    const chunks = await itemsRepository.listAllChunks();
    this.index = chunks.map(this.toIndexedChunk);
    logger.info({ chunkCount: this.index.length }, "vector store hydrated from MongoDB");
  }

  addChunks(chunks: ChunkDocument[]): void {
    this.index.push(...chunks.map(this.toIndexedChunk));
  }

  removeItem(itemId: string): void {
    this.index = this.index.filter((chunk) => chunk.itemId !== itemId);
  }

  searchSimilar(queryEmbedding: number[], topK: number): SimilarityMatch[] {
    return this.index
      .map((chunk) => ({
        id: chunk.id,
        itemId: chunk.itemId,
        text: chunk.text,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  size(): number {
    return this.index.length;
  }

  private toIndexedChunk = (chunk: ChunkDocument): IndexedChunk => {
    return { id: chunk._id, itemId: chunk.itemId, text: chunk.text, embedding: chunk.embedding };
  };

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorStore = new VectorStore();
