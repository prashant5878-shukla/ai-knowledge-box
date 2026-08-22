import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/shared/api/httpClient";
import { DigestPanel } from "@/features/digest/DigestPanel";
import { IngestForm } from "@/features/ingestion/IngestForm";
import { itemsApi } from "@/features/items/items.api";
import { ItemsList } from "@/features/items/ItemsList";
import { QueryPanel } from "@/features/query/QueryPanel";
import type { ItemSummary } from "@/shared/types";

/** Owns the saved-items list (fetch, refresh, delete) and hands it down as props —
 * IngestForm and DigestPanel/QueryPanel don't need this state, so it stays here
 * rather than being duplicated or lifted into a global store. */
export default function App() {
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await itemsApi.fetchAll();
      setItems(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load saved items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleIngested = (): void => {
    void loadItems();
  };

  const handleDelete = async (id: string): Promise<void> => {
    setDeletingId(id);
    setError(null);
    try {
      await itemsApi.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base font-semibold text-white shadow-sm shadow-brand-500/30">
            K
          </div>
          <div>
            <h1 className="font-serif text-lg font-semibold leading-tight text-slate-900">AI Knowledge Inbox</h1>
            <p className="text-sm text-slate-500">Save notes and links, then ask questions over them.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <IngestForm onIngested={handleIngested} />
          <ItemsList
            items={items}
            isLoading={isLoading}
            error={error}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </div>
        <div className="flex flex-col gap-6">
          <QueryPanel />
          <DigestPanel />
        </div>
      </main>
    </div>
  );
}
