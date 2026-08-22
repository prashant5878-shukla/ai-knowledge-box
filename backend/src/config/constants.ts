/**
 * Centralized, tunable constants for the RAG pipeline. Kept in one place so the
 * retrieval/rerank/chunking tradeoffs documented in SYSTEM.md map directly to a
 * single source of truth instead of magic numbers scattered across modules.
 */

// Chunking (see SYSTEM.md: "Chunking strategy")
export const CHUNK_SIZE_CHARS = 800;
export const CHUNK_OVERLAP_CHARS = 100;
export const PARAGRAPH_BREAK_SEARCH_RATIO = 0.5; // don't accept a paragraph break earlier than 50% into the window

// Retrieval + reranking (see SYSTEM.md: "Why LLM-based reranking")
export const VECTOR_SEARCH_TOP_K = 15; // candidates pulled from the vector index
export const RERANK_TOP_N = 5; // candidates kept after reranking, used as LLM context

// URL ingestion
export const URL_FETCH_TIMEOUT_MS = 10_000;
export const MAX_PAGE_CONTENT_LENGTH = 200_000;

// Content limits
export const MAX_NOTE_LENGTH = 50_000;
export const MIN_CONTENT_LENGTH = 1;
export const ITEM_TITLE_MAX_LENGTH = 60;
export const ITEM_PREVIEW_LENGTH = 240;

// Digest email generation (bonus, see SYSTEM.md: "Scope note: the digest feature")
// User-facing spend control: caps Gemini's maxOutputTokens for a single /digest call.
// NOTE: gemini-2.5-flash spends "thinking" tokens out of this same budget before any
// visible output, and the installed @langchain/google-genai SDK can't disable that — so
// very low budgets are more likely to leave zero tokens for the actual email (see
// digestGraph.ts retry-on-empty-response handling, and SYSTEM.md).
export const DIGEST_MIN_OUTPUT_TOKENS = 64;
export const DIGEST_MAX_OUTPUT_TOKENS = 4_000;
export const DIGEST_DEFAULT_OUTPUT_TOKENS = 500;
