# Design Decisions & Tradeoffs

This document explains the key engineering decisions behind this RAG system, why each was made, what the
alternative would have been, and what's explicitly out of scope. For a line-by-line code walkthrough see
`SYSTEM.md`; this doc is the condensed version aimed at a reviewer.

## Scope

Core, graded surface: save a note or URL (`/ingest`), list saved items (`/items`), ask a question over them
(`/query`) with cited answers. The digest-email feature (`/digest`) is a bonus layered on the same
retrieve+rerank pipeline — it's not part of the core assignment surface and is called out as such in the route
comments (`rag.routes.ts`).

## Core design decisions

### 1. Chunking: fixed-size character windows, not semantic chunking

**Decision:** Split ingested text into ~800-character windows with 100 characters of overlap
(`chunking.ts`), preferring to cut on a paragraph break when one falls in the back half of the window.

**Why:** Deterministic, zero extra model calls, and matches this app's content (personal notes, short
articles) well enough that content-aware splitting wouldn't materially change retrieval quality.

**Tradeoff / alternative considered:** Semantic chunking (embed sentences individually, cut where meaning
shifts) or structure-aware chunking (split on markdown headers/code fences first) would handle code, tables,
and long structured documents better — this app doesn't need that yet, but it's the first thing to revisit if
content type expands beyond prose.

### 2. Vector store: in-memory linear scan, not an ANN index or vector DB

**Decision:** Store every chunk's embedding in a plain array in process memory (`vectorStore.ts`); search is a
brute-force cosine-similarity scan over the whole array, sorted and sliced to top-K. Backed by MongoDB as the
durable source of truth; the in-memory array is a read-through cache rebuilt at boot.

**Why:** Zero infrastructure — no vector DB to provision, no ANN index to tune. At this app's actual scale
(single user, low-thousands of chunks) a linear scan runs in single-digit milliseconds, so an approximate index
would add complexity with no measurable benefit yet.

**Tradeoff / known limitation:** This is the component most likely to need replacing first. Specifically:
- **Search cost is `O(n)` per query** — fine at low-thousands of chunks, but climbs linearly as the corpus
  grows, with no way to shortcut it.
- **No tenant/user scoping.** The index has no `userId` field — it was built under an explicit single-user
  assumption. Adding a second user without adding scoping would be a data-isolation bug, not just a perf
  concern.
- **Doesn't survive horizontal scaling.** Each server instance builds its own in-memory copy at boot; writes to
  one instance never reach another's copy, so running >1 instance behind a load balancer produces
  instance-dependent, inconsistent search results.

**What I'd do differently at scale:** move to pgvector (if already on Postgres) or a purpose-built vector DB
(Qdrant/Pinecone/Weaviate) with an HNSW/IVF index, and add tenant scoping to every query the moment a second
user exists — before addressing performance at all.

### 3. Reranking: a listwise LLM call, not a dedicated cross-encoder

**Decision:** After vector search returns 15 candidates (`VECTOR_SEARCH_TOP_K`), if there are more than 5
(`RERANK_TOP_N`) an LLM call scores all of them 0–10 for relevance and re-sorts (`reranking.ts`); the top 5
proceed to generation. Skipped entirely when ≤5 candidates exist, since there'd be nothing left to cut.

**Why:** Embedding similarity is a decent first pass but an imprecise judge of relevance — it can rank a
chunk that merely shares vocabulary with the question above one that actually answers it. A second pass where
a model reads the candidate against the actual question fixes ordering mistakes retrieval alone can't. Building
it as one more LLM call (rather than hosting a separate cross-encoder model) keeps infrastructure at zero.

**Tradeoff:** This roughly doubles the chat-model cost and latency of any request with >5 candidates, versus a
dedicated small reranker model (e.g. a cross-encoder like `bge-reranker`), which would be both cheaper and
faster at that specific task. Chosen deliberately for this project's scope; would swap for a cross-encoder if
query volume or latency ever became a real constraint.

**Failure handling:** if the rerank call fails for any reason (timeout, malformed output, API error), it falls
back to the original vector-similarity order rather than failing the whole request — a degraded result, not a
broken one.

### 4. Generation: strict source-grounded prompting, not open-ended answering

**Decision:** The final LLM call is instructed to answer **only** from the numbered, reranked source chunks,
cite every claim inline (`[1]`, `[2]`...), and explicitly say so if the sources don't contain the answer,
instead of guessing (`queryGraph.ts`). Numbered citations with snippets are returned to the client so the
answer is independently verifiable against the actual source text.

**Why:** This is the core anti-hallucination mechanism for the whole system — constrain the model to cited,
retrieved text rather than trusting it to recall facts correctly, and give the user a way to check the answer
themselves rather than trusting it blindly.

**Tradeoff:** Grounding this strictly means the system will (correctly) refuse to answer questions its retrieved
context doesn't cover, rather than filling gaps with general knowledge — a deliberate precision-over-coverage
choice appropriate for a personal notes tool, where a wrong confident answer is worse than "I don't know."

### 5. Cost control: hard caps at every stage, model tier choice, structured output validation

**Decision:** `gemini-2.5-flash` (the cheap/fast tier, not a "pro" model) for both reranking and generation.
Every stage has a hard numeric ceiling from `constants.ts`: 15 candidates max from vector search, 5 chunks max
reach the final prompt, each truncated to 500 (rerank) or 300 (citation) characters. The rerank call is skipped
outright when it wouldn't change what reaches generation. Zero-candidate queries skip the LLM entirely and
return a canned message. The digest feature adds a user-facing `maxOutputTokens` slider that hard-caps a single
call's spend.

**Why:** A typical query costs exactly 2 chat-model calls (rerank + generate, both `flash`-tier) plus 1
embedding call — bounded and predictable regardless of how much a user has saved, rather than scaling with
corpus size.

**Known gap:** there's no caching layer (identical/near-duplicate questions re-run the full pipeline every
time) and no per-user rate limiting or auth — acceptable for a personal single-user tool, but the first two
things I'd add before exposing this to more than one trusted user.

### 6. URL ingestion: strict allow-list, but a known SSRF gap

**Decision:** `urlFetcher.ts` only allows `http`/`https`, checks content-type, caps page size, times out at
10s, and strips script/style/nav/footer before extracting readable text.

**Known limitation (explicitly flagged, not fixed):** URL validation checks the *protocol* but not where the
hostname actually resolves to — a submitted URL pointing at `localhost` or a cloud metadata endpoint
(`169.254.169.254`) would currently be fetched as-is. This is the highest-priority fix before this tool is ever
exposed multi-user or public-facing: resolve the hostname and reject private/reserved IP ranges, and re-validate
after any redirect.

Other known ingestion gaps, roughly in priority order: no retry on transient failures, no PDF/DOCX support
(HTML/plain-text only), no re-fetch mechanism for content that's changed since it was saved, and no handling
for JavaScript-rendered (SPA) pages, which come back as an empty shell since only static HTML is parsed.

### 7. LangGraph for orchestration, even though the pipeline is linear

**Decision:** `queryGraph.ts` and `digestGraph.ts` wire "retrieve → rerank → generate/compose" as LangGraph
`StateGraph`s rather than three sequential function calls.

**Why:** Makes each stage an independently named, independently testable unit with an explicit shared state
shape, and is the standard tool for this class of pipeline — worth the small amount of ceremony even though,
for a strictly linear three-step pipeline, three `await` calls in a row would behave identically today. The
payoff shows up if the pipeline needs to branch, loop, or run steps in parallel later (e.g. a future
query-rewriting or multi-query-retrieval step slotting in as an added node).

## Known limitations summary (what I'd flag to a reviewer proactively)

- No multi-tenant data isolation in the vector store (single-user assumption is structural, not just
  unimplemented).
- In-memory vector index doesn't scale past low-thousands of chunks and doesn't survive running >1 server
  instance.
- No caching layer — repeated/near-duplicate questions redo full retrieval + rerank + generation every time.
- No authentication or rate limiting on the API.
- SSRF gap in URL ingestion (see §6) — the single highest-priority security fix if this went multi-user.
- No automated retrieval/generation quality evaluation (precision/recall on a golden test set, faithfulness
  checks) — quality is currently verified manually, not via a repeatable metric.

`SYSTEM.md` covers all of the above in far more depth, including the specific scale point at which each one
starts to matter and the concrete fix for each.
