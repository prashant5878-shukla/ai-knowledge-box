interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label ?? "Loading..."}
    </div>
  );
}
