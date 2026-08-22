export type ItemType = "note" | "url";

export interface ItemSummary {
  id: string;
  type: ItemType;
  title: string;
  sourceUrl?: string;
  createdAt: string;
  preview: string;
  chunkCount: number;
}

export interface SourceCitation {
  id: number;
  itemId: string;
  itemTitle: string;
  snippet: string;
  score: number;
}

export interface QueryResult {
  answer: string;
  sources: SourceCitation[];
}

export interface DigestResult {
  subject: string;
  body: string;
  sources: SourceCitation[];
  maxOutputTokens: number;
}
