import { apiClient } from "@/shared/api/httpClient";
import type { ItemSummary } from "@/shared/types";

class ItemsApi {
  fetchAll(): Promise<ItemSummary[]> {
    return apiClient.get<ItemSummary[]>("/items");
  }

  delete(id: string): Promise<void> {
    return apiClient.delete(`/items/${encodeURIComponent(id)}`);
  }
}

export const itemsApi = new ItemsApi();
