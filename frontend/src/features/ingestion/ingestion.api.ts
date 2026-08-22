import { apiClient } from "@/shared/api/httpClient";
import type { ItemSummary, ItemType } from "@/shared/types";

export interface IngestPayload {
  type: ItemType;
  content: string;
  title?: string;
}

class IngestionApi {
  ingest(payload: IngestPayload): Promise<ItemSummary> {
    return apiClient.post<ItemSummary>("/ingest", payload);
  }
}

export const ingestionApi = new IngestionApi();
