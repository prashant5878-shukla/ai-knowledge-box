import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { DIGEST_DEFAULT_OUTPUT_TOKENS } from "../../config/constants.js";
import { env } from "../../config/env.js";
import { UpstreamFetchError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { CitationBuilder, type SourceCitation } from "./citations.js";
import { retrievalService } from "./retrieval.js";
import type { RetrievedChunk } from "./retrieval.js";
import { rerankingService } from "./reranking.js";

// Bonus feature, layered on the same retrieve+rerank pipeline as /query. Not part
// of the graded core surface — see SYSTEM.md. Generates a draft only; nothing is sent.
const DEFAULT_DIGEST_QUERY =
  "Summarize the most useful, interesting, or actionable information from my saved notes.";

const NO_CONTENT_SUBJECT = "Your Knowledge Inbox is empty";
const NO_CONTENT_BODY = "Add a few notes or URLs first, then ask for a digest.";

// gemini-2.5-flash's "thinking" tokens are drawn from the same maxOutputTokens budget,
// and can non-deterministically consume all of it before any visible output — the
// installed @langchain/google-genai SDK doesn't let us disable thinking, and crashes
// (instead of erroring cleanly) when that happens. Retrying at the SAME budget is safe
// (it doesn't spend more than the user authorized) and usually succeeds within a couple
// of attempts since thinking length varies per call.
const EMPTY_RESPONSE_MAX_ATTEMPTS = 4;

const emailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

const DigestState = Annotation.Root({
  topic: Annotation<string | undefined>,
  maxOutputTokens: Annotation<number>,
  candidates: Annotation<RetrievedChunk[]>,
  reranked: Annotation<RetrievedChunk[]>,
  subject: Annotation<string>,
  body: Annotation<string>,
  sources: Annotation<SourceCitation[]>,
});

export interface DigestResult {
  subject: string;
  body: string;
  sources: SourceCitation[];
  maxOutputTokens: number;
}

/**
 * retrieve → rerank → compose, as a LangGraph StateGraph. See QueryGraph's field-order
 * note — the same constraint applies here: node methods must be declared above `graph`.
 */
class DigestGraph {
  private retrieveNode = async (state: typeof DigestState.State) => {
    const query = state.topic?.trim() || DEFAULT_DIGEST_QUERY;
    const candidates = await retrievalService.retrieveCandidates(query);
    return { candidates };
  };

  private rerankNode = async (state: typeof DigestState.State) => {
    if (state.candidates.length === 0) return { reranked: [] };
    const query = state.topic?.trim() || DEFAULT_DIGEST_QUERY;
    const reranked = await rerankingService.rerankChunks(query, state.candidates);
    return { reranked };
  };

  private composeNode = async (state: typeof DigestState.State) => {
    if (state.reranked.length === 0) {
      return { subject: NO_CONTENT_SUBJECT, body: NO_CONTENT_BODY, sources: [] };
    }

    const { contextBlock, sources } = CitationBuilder.build(state.reranked);
    const focus = state.topic?.trim() || "whatever stands out as most worth surfacing";
    const composer = this.buildComposer(state.maxOutputTokens);
    const messages = [
      {
        role: "system" as const,
        content:
          "You write short, personalized email digests summarizing a user's saved notes. Use ONLY " +
          "the numbered sources below, cite claims inline like [1], and keep the tone plain and useful " +
          `(no marketing fluff). Stay within a strict budget of about ${state.maxOutputTokens} output tokens ` +
          "total — prefer a shorter, complete draft over a longer one cut off mid-sentence. Produce a " +
          "subject line and a body.",
      },
      { role: "user" as const, content: `Focus: ${focus}\n\nSources:\n${contextBlock}` },
    ];

    let lastErr: unknown;
    for (let attempt = 1; attempt <= EMPTY_RESPONSE_MAX_ATTEMPTS; attempt++) {
      try {
        const result = await composer.invoke(messages);
        return { subject: result.subject, body: result.body, sources };
      } catch (err) {
        lastErr = err;
        if (!this.looksLikeEmptyResponseCrash(err)) break;
        logger.warn({ attempt, maxOutputTokens: state.maxOutputTokens }, "digest composer returned no content, retrying");
      }
    }

    logger.error({ err: lastErr }, "digest composition failed");
    if (this.looksLikeEmptyResponseCrash(lastErr)) {
      throw new UpstreamFetchError(
        `The model produced no output within a ${state.maxOutputTokens}-token budget (likely spent on internal ` +
          "reasoning) — try raising the token budget and generating again.",
      );
    }
    throw new UpstreamFetchError("Failed to compose the digest email");
  };

  // Must come after the node methods above (see class doc comment).
  private graph = new StateGraph(DigestState)
    .addNode("retrieve", this.retrieveNode)
    .addNode("rerank", this.rerankNode)
    .addNode("compose", this.composeNode)
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "rerank")
    .addEdge("rerank", "compose")
    .addEdge("compose", END)
    .compile();

  async composeDigest(topic?: string, maxOutputTokens?: number): Promise<DigestResult> {
    const budget = maxOutputTokens ?? DIGEST_DEFAULT_OUTPUT_TOKENS;
    const result = await this.graph.invoke({ topic, maxOutputTokens: budget });
    return { subject: result.subject, body: result.body, sources: result.sources, maxOutputTokens: budget };
  }

  // Built per-request (not a class field) so each digest call can apply its own
  // spend/token budget without leaking that cap onto other requests.
  private buildComposer(maxOutputTokens: number) {
    return new ChatGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
      model: env.CHAT_MODEL,
      temperature: 0.4,
      maxOutputTokens,
    }).withStructuredOutput(emailSchema, { name: "compose_email" });
  }

  private looksLikeEmptyResponseCrash(err: unknown): boolean {
    // The SDK crashes inside this specific function when Gemini returns no candidates
    // (all budget spent on thinking) — match on the crash site, not the property name,
    // since which property is undefined first varies ("length", "parts", etc).
    return err instanceof TypeError && (err.stack?.includes("mapGenerateContentResultToChatResult") ?? false);
  }
}

export const digestGraph = new DigestGraph();
