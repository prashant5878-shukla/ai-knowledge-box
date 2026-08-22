import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { RERANK_TOP_N } from "../../config/constants.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import type { RetrievedChunk } from "./retrieval.js";

const rerankScoresSchema = z.object({
  scores: z.array(
    z.object({
      chunkId: z.string(),
      relevance: z.number().min(0).max(10),
    }),
  ),
});

/**
 * Listwise LLM rerank: cheap to build (one extra chat call, no separate model to
 * host) but higher latency/cost per query than a dedicated cross-encoder. See
 * SYSTEM.md for the production tradeoff.
 */
class RerankingService {
  private reranker = new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    model: env.CHAT_MODEL,
    temperature: 0,
  }).withStructuredOutput(rerankScoresSchema, { name: "score_chunks" });

  async rerankChunks(query: string, candidates: RetrievedChunk[]): Promise<RetrievedChunk[]> {
    if (candidates.length === 0) return [];
    if (candidates.length <= RERANK_TOP_N) return candidates;

    try {
      const result = await this.reranker.invoke([
        {
          role: "system",
          content:
            "You are a relevance-scoring engine for a retrieval system. Score how relevant each " +
            "candidate passage is to the user's question, from 0 (irrelevant) to 10 (directly answers it). " +
            "Return a score for every chunkId given, no more, no fewer.",
        },
        { role: "user", content: this.buildScoringPrompt(query, candidates) },
      ]);

      return this.applyScores(candidates, result.scores).slice(0, RERANK_TOP_N);
    } catch (err) {
      logger.warn({ err }, "rerank call failed, falling back to vector-similarity order");
      return candidates.slice(0, RERANK_TOP_N);
    }
  }

  private buildScoringPrompt(query: string, candidates: RetrievedChunk[]): string {
    const passages = candidates
      .map((c) => `[chunkId: ${c.chunkId}]\n${c.text.slice(0, 500)}`)
      .join("\n\n---\n\n");
    return `Question: ${query}\n\nCandidate passages:\n\n${passages}`;
  }

  private applyScores(
    candidates: RetrievedChunk[],
    scores: { chunkId: string; relevance: number }[],
  ): RetrievedChunk[] {
    const scoreMap = new Map(scores.map((s) => [s.chunkId, s.relevance]));
    return [...candidates].sort(
      (a, b) => (scoreMap.get(b.chunkId) ?? 0) - (scoreMap.get(a.chunkId) ?? 0),
    );
  }
}

export const rerankingService = new RerankingService();
