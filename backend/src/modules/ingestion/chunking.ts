import {
  CHUNK_OVERLAP_CHARS,
  CHUNK_SIZE_CHARS,
  PARAGRAPH_BREAK_SEARCH_RATIO,
} from "../../config/constants.js";

/**
 * Fixed-size character windows with overlap, breaking on paragraph boundaries
 * when a break point is available near the window edge. See SYSTEM.md for why
 * this was chosen over token-aware or semantic chunking. Holds no state, so its
 * one entry point is a static method rather than requiring an instance.
 */
export class TextChunker {
  static chunk(text: string): string[] {
    const normalized = TextChunker.normalizeWhitespace(text);
    if (normalized.length === 0) return [];
    if (normalized.length <= CHUNK_SIZE_CHARS) return [normalized];

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      const end = TextChunker.findChunkEnd(normalized, start);

      const chunk = normalized.slice(start, end).trim();
      if (chunk.length > 0) chunks.push(chunk);

      if (end >= normalized.length) break;
      start = end - CHUNK_OVERLAP_CHARS;
    }

    return chunks;
  }

  private static normalizeWhitespace(text: string): string {
    return text.replace(/\r\n/g, "\n").trim();
  }

  private static findChunkEnd(text: string, start: number): number {
    const maxEnd = Math.min(start + CHUNK_SIZE_CHARS, text.length);
    if (maxEnd >= text.length) return maxEnd;

    const paragraphBreak = text.lastIndexOf("\n\n", maxEnd);
    const earliestAcceptableBreak = start + CHUNK_SIZE_CHARS * PARAGRAPH_BREAK_SEARCH_RATIO;
    return paragraphBreak > earliestAcceptableBreak ? paragraphBreak : maxEnd;
  }
}
