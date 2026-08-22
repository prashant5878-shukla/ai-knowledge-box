import type { SourceCitation } from "@/shared/types";

interface SourceListProps {
  sources: SourceCitation[];
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sources</h4>
      {sources.map((source) => (
        <div key={source.id} className="rounded-md border border-slate-200 bg-white p-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-slate-700">
              <span className="mr-1 inline-flex h-4 min-w-4 items-center justify-center rounded bg-brand-100 px-1 text-[10px] font-semibold text-brand-700">
                {source.id}
              </span>
              {source.itemTitle}
            </span>
            <span className="shrink-0 text-slate-400">match {(source.score * 100).toFixed(0)}%</span>
          </div>
          <p className="mt-1 text-slate-500">{source.snippet}</p>
        </div>
      ))}
    </div>
  );
}
