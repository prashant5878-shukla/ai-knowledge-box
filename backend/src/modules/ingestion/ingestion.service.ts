import { nanoid } from "nanoid";
import { ITEM_TITLE_MAX_LENGTH } from "../../config/constants.js";
import { logger } from "../../lib/logger.js";
import { embeddingsService } from "../embeddings/embeddings.service.js";
import { itemsRepository } from "../items/items.repository.js";
import type { ChunkDocument, ItemDocument, ItemType } from "../items/items.types.js";
import { vectorStore } from "../vectorStore/vectorStore.js";
import { TextChunker } from "./chunking.js";
import { UrlFetcher } from "./urlFetcher.js";

export interface IngestInput {
  type: ItemType;
  content: string;
  title?: string;
}

class IngestionService {
  private urlFetcher = new UrlFetcher();

  async ingestItem(input: IngestInput): Promise<ItemDocument> {
    const { rawContent, title, sourceUrl } = await this.resolveContent(input);

    const item: ItemDocument = {
      _id: nanoid(),
      type: input.type,
      title,
      sourceUrl,
      rawContent,
      createdAt: new Date().toISOString(),
      chunkCount: 0,
    };

    const chunkTexts = TextChunker.chunk(rawContent);
    const embeddings = await embeddingsService.embedTexts(chunkTexts);

    const chunks: ChunkDocument[] = chunkTexts.map((text, index) => ({
      _id: nanoid(),
      itemId: item._id,
      chunkIndex: index,
      text,
      embedding: embeddings[index],
      createdAt: item.createdAt,
    }));

    item.chunkCount = chunks.length;

    await itemsRepository.insertItem(item);
    await itemsRepository.insertChunks(chunks);
    vectorStore.addChunks(chunks);

    logger.info({ itemId: item._id, type: item.type, chunkCount: chunks.length }, "item ingested");

    return item;
  }

  private async resolveContent(
    input: IngestInput,
  ): Promise<{ rawContent: string; title: string; sourceUrl?: string }> {
    if (input.type === "note") {
      const title = input.title?.trim() || this.deriveNoteTitle(input.content);
      return { rawContent: input.content.trim(), title };
    }

    const page = await this.urlFetcher.fetchPageContent(input.content.trim());
    return {
      rawContent: page.text,
      title: input.title?.trim() || page.title,
      sourceUrl: input.content.trim(),
    };
  }

  private deriveNoteTitle(content: string): string {
    const firstLine = content.trim().split("\n")[0] ?? "";
    if (firstLine.length === 0) return "Untitled note";
    return firstLine.length > ITEM_TITLE_MAX_LENGTH
      ? `${firstLine.slice(0, ITEM_TITLE_MAX_LENGTH - 3)}...`
      : firstLine;
  }
}

export const ingestionService = new IngestionService();
