import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "@/shared/api/httpClient";
import { Card } from "@/shared/components/Card";
import { ErrorBanner } from "@/shared/components/ErrorBanner";
import type { ItemType } from "@/shared/types";
import { ingestionApi } from "./ingestion.api";

interface IngestFormProps {
  onIngested: () => void;
}

export function IngestForm({ onIngested }: IngestFormProps) {
  const [type, setType] = useState<ItemType>("note");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setContent(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (content.trim().length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await ingestionApi.ingest({ type, content: content.trim() });
      setContent("");
      onIngested();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save this item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title="Add to your inbox" subtitle="Save a note or point at a URL to index">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          {(["note", "url"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                type === option
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-500/30"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option === "note" ? "Note" : "URL"}
            </button>
          ))}
        </div>

        {type === "note" ? (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Paste or write a note..."
            rows={4}
            className="rounded-md border border-slate-300 p-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        ) : (
          <input
            type="text"
            value={content}
            onChange={handleContentChange}
            placeholder="https://example.com/article"
            className="rounded-md border border-slate-300 p-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        )}

        {error && <ErrorBanner message={error} />}

        <button
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
          className="self-start rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </form>
    </Card>
  );
}
