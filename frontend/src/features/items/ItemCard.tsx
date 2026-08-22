import { useState } from "react";
import type { ItemSummary } from "@/shared/types";

const TYPE_LABEL: Record<ItemSummary["type"], string> = {
  note: "Note",
  url: "URL",
};

const TYPE_BADGE: Record<ItemSummary["type"], string> = {
  note: "bg-brand-50 text-brand-700",
  url: "bg-sky-50 text-sky-700",
};

interface ItemCardProps {
  item: ItemSummary;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function ItemCard({ item, onDelete, isDeleting }: ItemCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    void onDelete();
  };

  const handleBlur = () => {
    setConfirming(false);
  };

  return (
    <li className="rounded-lg border border-slate-200 p-3 transition-colors hover:border-slate-300">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[item.type]}`}
        >
          {TYPE_LABEL[item.type]}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
          <button
            type="button"
            onClick={handleDeleteClick}
            onBlur={handleBlur}
            disabled={isDeleting}
            className={
              confirming
                ? "rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white shadow-sm shadow-red-500/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                : "rounded-full px-2 py-0.5 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            }
            aria-label={confirming ? `Confirm delete "${item.title}"` : `Delete "${item.title}"`}
          >
            {isDeleting ? "Deleting…" : confirming ? "Confirm delete?" : "Delete"}
          </button>
        </div>
      </div>
      <h3 className="mt-1.5 text-sm font-medium text-slate-900">{item.title}</h3>
      {item.sourceUrl && (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-sky-600 hover:underline"
        >
          {item.sourceUrl}
        </a>
      )}
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.preview}</p>
      <p className="mt-1 text-xs text-slate-400">{item.chunkCount} chunk(s) indexed</p>
    </li>
  );
}
