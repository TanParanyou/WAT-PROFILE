"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { CalendarLabels } from "../../calendar-copy";

interface CalendarQueryBoundaryProps<TData> {
  query: UseQueryResult<TData, Error>;
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
    <>
      {query.isFetching ? <p className="mb-3 text-sm opacity-70" role="status">{labels.refreshing ?? labels.loading ?? "Refreshing"}</p> : null}
      {children(query.data)}
    </>
  );
}

