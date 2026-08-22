const API_BASE = "/api";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiSuccessEnvelope<T> {
  data: T;
}

interface ApiErrorEnvelope {
  error: { code: string; message: string; details?: unknown };
}

/** Every feature's `*Api` class (ItemsApi, IngestionApi, QueryApi, DigestApi) goes
 * through this one instance instead of calling `fetch` directly, so the response
 * envelope (`{ data }` / `{ error }`) and error mapping only need to be handled once. */
class ApiClient {
  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, payload: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(payload) });
  }

  async delete(path: string): Promise<void> {
    return this.request<void>(path, { method: "DELETE" });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });

    // 204 No Content (e.g. DELETE) has no body to parse and no `data` to return.
    if (response.status === 204) {
      if (!response.ok) throw new ApiError(response.status, "UNKNOWN_ERROR", `Request to ${path} failed`);
      return undefined as T;
    }

    const body = (await response.json().catch(() => null)) as
      | ApiSuccessEnvelope<T>
      | ApiErrorEnvelope
      | null;

    if (!response.ok || !body || "error" in body) {
      const errorBody = body && "error" in body ? body.error : undefined;
      throw new ApiError(
        response.status,
        errorBody?.code ?? "UNKNOWN_ERROR",
        errorBody?.message ?? `Request to ${path} failed with status ${response.status}`,
        errorBody?.details,
      );
    }

    return body.data;
  }
}

export const apiClient = new ApiClient();
