import { VECTOR_SEARCH_TOP_K } from "../../config/constants.js";
import { embeddingsService } from "../embeddings/embeddings.service.js";
import { itemsRepository } from "../items/items.repository.js";
import { vectorStore } from "../vectorStore/vectorStore.js";

export interface RetrievedChunk {
  chunkId: string;
  itemId: string;
  itemTitle: string;
  text: string;
  score: number;
}

class RetrievalService {
  async retrieveCandidates(query: string): Promise<RetrievedChunk[]> {
    const queryEmbedding = await embeddingsService.embedQuery(query);
    const matches = vectorStore.searchSimilar(queryEmbedding, VECTOR_SEARCH_TOP_K);
    if (matches.length === 0) return [];

    const items = await itemsRepository.findItemsByIds([...new Set(matches.map((m) => m.itemId))]);

    return matches.map((match) => ({
      chunkId: match.id,
      itemId: match.itemId,
      itemTitle: items.get(match.itemId)?.title ?? "Unknown source",
      text: match.text,
      score: match.score,
    }));
  }
}

export const retrievalService = new RetrievalService();
