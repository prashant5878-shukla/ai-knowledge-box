import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "@/shared/api/httpClient";
import { Card } from "@/shared/components/Card";
import { ErrorBanner } from "@/shared/components/ErrorBanner";
import { SourceList } from "@/shared/components/SourceList";
import { Spinner } from "@/shared/components/Spinner";
import type { DigestResult } from "@/shared/types";
import { digestApi } from "./digest.api";

// Mirrors backend/src/config/constants.ts DIGEST_MIN/MAX/DEFAULT_OUTPUT_TOKENS.
const MIN_TOKEN_BUDGET = 64;
const MAX_TOKEN_BUDGET = 4_000;
const DEFAULT_TOKEN_BUDGET = 500;

/**
 * Bonus feature: reuses the same retrieve+rerank pipeline as /query but composes
 * a personalized email draft instead of answering a question. Preview only —
 * nothing is sent. Kept visually separate from the core Q&A flow.
 */
export function DigestPanel() {
  const [topic, setTopic] = useState("");
  const [tokenBudget, setTokenBudget] = useState(DEFAULT_TOKEN_BUDGET);
  const [result, setResult] = useState<DigestResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTopicChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTopic(event.target.value);
  };

  const handleTokenSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTokenBudget(Number(event.target.value));
  };

  const handleTokenInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const clamped = Math.min(MAX_TOKEN_BUDGET, Math.max(MIN_TOKEN_BUDGET, Number(event.target.value) || MIN_TOKEN_BUDGET));
    setTokenBudget(clamped);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setIsGenerating(true);
    setError(null);
    try {
      const result = await digestApi.generate(topic.trim() || undefined, tokenBudget);
      setResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate a digest");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card
      title="Generate a digest email (bonus)"
      subtitle="Drafts a personalized email from your notes — preview only, nothing is sent"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={handleTopicChange}
            placeholder="Optional focus, e.g. 'career notes' (leave blank for a general digest)"
            className="flex-1 rounded-md border border-slate-300 p-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          >
            Draft
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <label htmlFor="digest-token-budget" className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Token budget
          </label>
          <input
            id="digest-token-budget"
            type="range"
            min={MIN_TOKEN_BUDGET}
            max={MAX_TOKEN_BUDGET}
            step={16}
            value={tokenBudget}
            onChange={handleTokenSliderChange}
            className="flex-1 accent-brand-600"
          />
          <input
            type="number"
            min={MIN_TOKEN_BUDGET}
            max={MAX_TOKEN_BUDGET}
            value={tokenBudget}
            onChange={handleTokenInputChange}
            className="w-16 rounded-md border border-slate-300 bg-white p-1 text-right text-xs transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <span className="text-xs text-slate-500 whitespace-nowrap">tokens</span>
        </div>
        <p className="text-xs text-slate-400">
          Caps how much the model is allowed to generate for this draft — lower spends less, higher allows a longer email.
        </p>
      </form>

      {isGenerating && <div className="mt-3"><Spinner label="Retrieving, reranking, and composing..." /></div>}
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      {!isGenerating && result && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</p>
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              {result.maxOutputTokens} token budget
            </span>
          </div>
          <p className="font-serif text-sm font-semibold text-slate-900">{result.subject}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{result.body}</p>
          <SourceList sources={result.sources} />
        </div>
      )}
    </Card>
  );
}
