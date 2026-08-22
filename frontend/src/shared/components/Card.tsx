import type { PropsWithChildren, ReactNode } from "react";

interface CardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Card({ title, subtitle, actions, children }: PropsWithChildren<CardProps>) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-shadow hover:shadow-md hover:shadow-slate-200/70">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
