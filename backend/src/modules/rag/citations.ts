import type { RetrievedChunk } from "./retrieval.js";

const SNIPPET_LENGTH = 300;

export interface SourceCitation {
  id: number;
  itemId: string;
  itemTitle: string;
  snippet: string;
  score: number;
}

export interface CitedContext {
  contextBlock: string;
  sources: SourceCitation[];
}

/**
 * Numbers reranked chunks 1..N for citation, and renders the prompt block the
 * LLM sees. Shared by QueryGraph and DigestGraph so citation numbering stays
 * consistent between "answer a question" and "compose a digest". Stateless, so
 * its one method is static.
 */
export class CitationBuilder {
  static build(chunks: RetrievedChunk[]): CitedContext {
    const sources: SourceCitation[] = chunks.map((chunk, index) => ({
      id: index + 1,
      itemId: chunk.itemId,
      itemTitle: chunk.itemTitle,
      snippet: chunk.text.slice(0, SNIPPET_LENGTH),
      score: chunk.score,
    }));

    const contextBlock = sources
      .map((source) => `[${source.id}] (${source.itemTitle})\n${source.snippet}`)
      .join("\n\n");

    return { contextBlock, sources };
  }
}
