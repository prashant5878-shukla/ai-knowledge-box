import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { env } from "../../config/env.js";
import { UpstreamFetchError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { retrievalService } from "./retrieval.js";
import type { RetrievedChunk } from "./retrieval.js";
import { rerankingService } from "./reranking.js";
import { CitationBuilder, type SourceCitation } from "./citations.js";

const NO_CONTENT_ANSWER =
  "There's nothing in your Knowledge Inbox yet, so I don't have anything to answer from. Add a note or URL first.";

const QueryState = Annotation.Root({
  question: Annotation<string>,
  candidates: Annotation<RetrievedChunk[]>,
  reranked: Annotation<RetrievedChunk[]>,
  answer: Annotation<string>,
  sources: Annotation<SourceCitation[]>,
});

export interface QueryResult {
  answer: string;
  sources: SourceCitation[];
}

/**
 * retrieve → rerank → generate, as a LangGraph StateGraph. The node methods are
 * arrow function class properties (not prototype methods) because they're handed
 * to `.addNode()` as bare function references — a prototype method passed that way
 * would lose its `this` binding when LangGraph calls it internally.
 *
 * Field order matters here: `graph`'s initializer calls `.addNode(..., this.retrieveNode)`
 * immediately, and class fields initialize top-to-bottom, so the node methods must be
 * declared above `graph` — otherwise `this.retrieveNode` would still be undefined.
 */
class QueryGraph {
  private chatModel = new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    model: env.CHAT_MODEL,
    temperature: 0.2,
  });

  private retrieveNode = async (state: typeof QueryState.State) => {
    const candidates = await retrievalService.retrieveCandidates(state.question);
    return { candidates };
  };

  private rerankNode = async (state: typeof QueryState.State) => {
    if (state.candidates.length === 0) return { reranked: [] };
    const reranked = await rerankingService.rerankChunks(state.question, state.candidates);
    return { reranked };
  };

  private generateNode = async (state: typeof QueryState.State) => {
    if (state.reranked.length === 0) {
      return { answer: NO_CONTENT_ANSWER, sources: [] };
    }

    const { contextBlock, sources } = CitationBuilder.build(state.reranked);

    try {
      const response = await this.chatModel.invoke([
        {
          role: "system",
          content:
            "Answer the user's question using ONLY the numbered sources below. Cite sources inline " +
            'using bracket notation like [1] or [2] right after the claim they support. If the sources ' +
            "don't contain the answer, say so plainly instead of guessing.",
        },
        { role: "user", content: `${contextBlock}\n\nQuestion: ${state.question}` },
      ]);

      return { answer: response.content.toString(), sources };
    } catch (err) {
      logger.error({ err }, "answer generation failed");
      throw new UpstreamFetchError("Failed to generate an answer from the language model");
    }
  };

  // Must come after the node methods above (see field-order note).
  private graph = new StateGraph(QueryState)
    .addNode("retrieve", this.retrieveNode)
    .addNode("rerank", this.rerankNode)
    .addNode("generate", this.generateNode)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "rerank")
    .addEdge("rerank", "generate")
    .addEdge("generate", END)
    .compile();

  async answerQuestion(question: string): Promise<QueryResult> {
    const result = await this.graph.invoke({ question });
    return { answer: result.answer, sources: result.sources };
  }
}

export const queryGraph = new QueryGraph();
