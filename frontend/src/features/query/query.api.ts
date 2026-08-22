import { apiClient } from "@/shared/api/httpClient";
import type { QueryResult } from "@/shared/types";

class QueryApi {
  ask(question: string): Promise<QueryResult> {
    return apiClient.post<QueryResult>("/query", { question });
  }
}

export const queryApi = new QueryApi();
