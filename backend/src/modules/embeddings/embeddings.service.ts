import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { UpstreamFetchError } from "../../lib/errors.js";

class EmbeddingsService {
  private embedder = new GoogleGenerativeAIEmbeddings({
    apiKey: env.GEMINI_API_KEY,
    model: `models/${env.EMBEDDING_MODEL}`,
  });

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      return await this.embedder.embedDocuments(texts);
    } catch (err) {
      logger.error({ err, count: texts.length }, "embedding request failed");
      throw new UpstreamFetchError("Failed to generate embeddings", { cause: (err as Error).message });
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      return await this.embedder.embedQuery(text);
    } catch (err) {
      logger.error({ err }, "query embedding failed");
      throw new UpstreamFetchError("Failed to embed query", { cause: (err as Error).message });
    }
  }
}

export const embeddingsService = new EmbeddingsService();
