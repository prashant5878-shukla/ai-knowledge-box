import type { Page } from "@playwright/test";

// Deterministic fixture data for the visual-reference screenshots (tests/visual/README.md).
// Mocked via page.route so screenshots don't depend on a live Gemini key or mutate real
// saved items, and so the same fixture set can be re-run for a stable before/after diff.

const ITEMS = [
  {
    id: "item-1",
    type: "note",
    title: "Q3 roadmap notes",
    createdAt: "2026-08-18T09:15:00.000Z",
    preview:
      "Ship the digest feature bonus by end of sprint. Reranking is the main cost/latency bottleneck at scale — worth revisiting before the multi-user push.",
    chunkCount: 2,
  },
  {
    id: "item-2",
    type: "url",
    title: "LangGraph: building stateful agent graphs",
    sourceUrl: "https://langchain-ai.github.io/langgraph/",
    createdAt: "2026-08-17T14:02:00.000Z",
    preview:
      "LangGraph models an agent as a state graph of nodes and edges, giving explicit control over retries, branching, and human-in-the-loop steps.",
    chunkCount: 4,
  },
  {
    id: "item-3",
    type: "note",
    title: "Client follow-up — Priya",
    createdAt: "2026-08-16T11:40:00.000Z",
    preview: "Reminded Priya about the pending confirmation on the billing migration scope. Awaiting a reply by Friday.",
    chunkCount: 1,
  },
  {
    id: "item-4",
    type: "note",
    title: "Reading list",
    createdAt: "2026-08-14T20:05:00.000Z",
    preview: "Designing Data-Intensive Applications, ch. 7 on transactions. Revisit the section on serializability.",
    chunkCount: 1,
  },
];

const SOURCES = [
  { id: 1, itemId: "item-1", itemTitle: "Q3 roadmap notes", snippet: "Ship the digest feature bonus by end of sprint.", score: 0.81 },
  { id: 2, itemId: "item-2", itemTitle: "LangGraph: building stateful agent graphs", snippet: "LangGraph models an agent as a state graph of nodes and edges.", score: 0.74 },
];

export async function mockPopulated(page: Page) {
  await page.route("**/api/items", (route) => route.fulfill({ json: { data: ITEMS } }));
  await page.route("**/api/query", (route) =>
    route.fulfill({
      json: {
        data: {
          answer:
            "You're mid-migration on the billing service (owned by Priya) and still owe the digest feature bonus by end of sprint [1]. LangGraph is the framework backing that feature [2].",
          sources: SOURCES,
        },
      },
    }),
  );
  await page.route("**/api/digest", (route) =>
    route.fulfill({
      json: {
        data: {
          subject: "Your week: billing migration + a LangGraph rabbit hole",
          body:
            "Quick digest of what's worth revisiting:\n\n- Billing migration is still waiting on Priya's confirmation [1].\n- The digest feature itself (this one!) is built on LangGraph's state-graph model [2].\n- Reranking is flagged as the next cost/latency bottleneck once this scales past one user.",
          sources: SOURCES,
          maxOutputTokens: 500,
        },
      },
    }),
  );
}

export async function mockEmpty(page: Page) {
  await page.route("**/api/items", (route) => route.fulfill({ json: { data: [] } }));
}
