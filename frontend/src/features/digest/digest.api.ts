import { apiClient } from "@/shared/api/httpClient";
import type { DigestResult } from "@/shared/types";

class DigestApi {
  generate(topic?: string, maxOutputTokens?: number): Promise<DigestResult> {
    return apiClient.post<DigestResult>("/digest", { topic, maxOutputTokens });
  }
}

export const digestApi = new DigestApi();
