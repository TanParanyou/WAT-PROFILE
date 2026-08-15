"use client";

import type { ReactNode } from "react";
import type { CalendarLabels } from "../../calendar-copy";

export interface CalendarQueryState<TData> {
  data: TData | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
}

interface CalendarQueryBoundaryProps<TData> {
  query: CalendarQueryState<TData>;
  labels: CalendarLabels;
  children: (data: TData) => ReactNode;
}

export function CalendarQueryBoundary<TData>({ query, labels, children }: CalendarQueryBoundaryProps<TData>) {
  if (!query.data && query.isPending) {
    return <p className="py-12 text-center text-sm" role="status">{labels.loading ?? "Loading"}</p>;
  }
  if (!query.data && query.isError) {
    return (
      <div className="space-y-3 border border-current/20 p-6 text-center">
        <p>{labels.error ?? "Unable to load calendar"}</p>
        <button type="button" onClick={() => void query.refetch()} className="min-h-11 border border-current px-4 text-sm">{labels.retry ?? "Retry"}</button>
      </div>
    );
  }
  if (!query.data) return null;

  return (
    <div className="relative" aria-busy={query.isFetching}>
      <p
        data-calendar-refresh-status
        role="status"
        aria-live="polite"
        aria-hidden={!query.isFetching}
        className={`pointer-events-none absolute right-0 top-0 z-30 border border-current/15 bg-current/10 px-2 py-1 text-xs motion-safe:transition-opacity motion-safe:duration-150 motion-reduce:transition-none ${query.isFetching ? "opacity-100" : "opacity-0"}`}
      >
        {labels.refreshing ?? labels.loading ?? "Refreshing"}
      </p>
      {children(query.data)}
    </div>
  );
}
