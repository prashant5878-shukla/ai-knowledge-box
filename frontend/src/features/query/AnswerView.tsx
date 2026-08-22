import { SourceList } from "@/shared/components/SourceList";
import type { QueryResult } from "@/shared/types";

interface AnswerViewProps {
  result: QueryResult;
}

export function AnswerView({ result }: AnswerViewProps) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{result.answer}</p>
      <SourceList sources={result.sources} />
    </div>
  );
}
