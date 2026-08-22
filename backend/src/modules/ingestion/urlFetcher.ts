import * as cheerio from "cheerio";
import { MAX_PAGE_CONTENT_LENGTH, URL_FETCH_TIMEOUT_MS } from "../../config/constants.js";
import { UpstreamFetchError, ValidationError } from "../../lib/errors.js";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_CONTENT_TYPES = ["text/html", "text/plain"];
const NOISE_SELECTORS = "script, style, noscript, nav, footer, header, svg";

export interface FetchedPage {
  title: string;
  text: string;
}

/** Holds no state between calls, but is a class (not static methods) because
 * ingestion.service.ts holds an instance of it — keeps the fetch step swappable
 * (e.g. for a test double) the same way the repository/service dependencies are. */
export class UrlFetcher {
  async fetchPageContent(url: string): Promise<FetchedPage> {
    const parsed = this.parseAndValidateUrl(url);
    const response = await this.fetchWithTimeout(parsed);
    this.assertOk(response, url);
    this.assertSupportedContentType(response, url);

    const html = await response.text();
    if (html.length > MAX_PAGE_CONTENT_LENGTH) {
      throw new ValidationError(`Page at "${url}" is too large to ingest`);
    }

    return this.extractReadableContent(html, parsed);
  }

  private parseAndValidateUrl(url: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ValidationError(`"${url}" is not a valid URL`);
    }
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      throw new ValidationError(`URL must use http or https, got "${parsed.protocol}"`);
    }
    return parsed;
  }

  private async fetchWithTimeout(url: URL): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS);
    try {
      return await fetch(url.toString(), {
        signal: controller.signal,
        headers: { "User-Agent": "KnowledgeInbox/1.0 (+personal RAG project)" },
      });
    } catch (err) {
      throw new UpstreamFetchError(`Could not reach "${url}"`, { cause: (err as Error).message });
    } finally {
      clearTimeout(timeout);
    }
  }

  private assertOk(response: Response, url: string): void {
    if (!response.ok) {
      throw new UpstreamFetchError(`Fetching "${url}" returned HTTP ${response.status}`);
    }
  }

  private assertSupportedContentType(response: Response, url: string): void {
    const contentType = response.headers.get("content-type") ?? "";
    const isSupported = ALLOWED_CONTENT_TYPES.some((allowed) => contentType.includes(allowed));
    if (!isSupported) {
      throw new ValidationError(`Unsupported content type "${contentType}" for "${url}"`);
    }
  }

  private extractReadableContent(html: string, url: URL): FetchedPage {
    const $ = cheerio.load(html);
    $(NOISE_SELECTORS).remove();

    const title = $("title").first().text().trim() || url.hostname;
    const text = $("body").text().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

    if (text.length === 0) {
      throw new ValidationError(`No readable text content found at "${url}"`);
    }

    return { title, text };
  }
}
