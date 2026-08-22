import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "@/shared/api/httpClient";
import { Card } from "@/shared/components/Card";
import { ErrorBanner } from "@/shared/components/ErrorBanner";
import { Spinner } from "@/shared/components/Spinner";
import type { QueryResult } from "@/shared/types";
import { AnswerView } from "./AnswerView";
import { queryApi } from "./query.api";

export function QueryPanel() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuestionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuestion(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length === 0) return;

    setIsAsking(true);
    setError(null);
    try {
      const result = await queryApi.ask(trimmed);
      setResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to get an answer");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <Card title="Ask a question" subtitle="Retrieval-augmented answers over your saved content">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={handleQuestionChange}
          placeholder="What did I save about..."
          className="flex-1 rounded-md border border-slate-300 p-2 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={isAsking || question.trim().length === 0}
          className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          Ask
        </button>
      </form>

      {isAsking && <div className="mt-3"><Spinner label="Retrieving and generating an answer..." /></div>}
      {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      {!isAsking && result && <AnswerView result={result} />}
    </Card>
  );
}
