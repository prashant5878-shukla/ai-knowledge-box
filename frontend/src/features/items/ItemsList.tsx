import { Card } from "@/shared/components/Card";
import { ErrorBanner } from "@/shared/components/ErrorBanner";
import { Spinner } from "@/shared/components/Spinner";
import type { ItemSummary } from "@/shared/types";
import { ItemCard } from "./ItemCard";

interface ItemsListProps {
  items: ItemSummary[];
  isLoading: boolean;
  error: string | null;
  onDelete: (id: string) => Promise<void>;
  deletingId: string | null;
}

export function ItemsList({ items, isLoading, error, onDelete, deletingId }: ItemsListProps) {
  return (
    <Card title="Saved items" subtitle={`${items.length} item(s) in your inbox`}>
      {isLoading && <Spinner label="Loading items..." />}
      {error && <ErrorBanner message={error} />}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M4 6h16M4 12h16M4 18h9"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="text-sm text-slate-500">Nothing saved yet. Add a note or URL to get started.</p>
        </div>
      )}
      {!isLoading && !error && items.length > 0 && (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={() => onDelete(item.id)}
              isDeleting={deletingId === item.id}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
