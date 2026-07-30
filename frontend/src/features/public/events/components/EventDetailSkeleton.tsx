export function EventDetailSkeleton() {
  return (
    <div className="space-y-10" aria-label="Loading event">
      <div className="space-y-6 border-y border-primary/15 py-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-4 w-40 animate-pulse rounded bg-primary/10" />
          <div className="h-4 w-28 animate-pulse rounded bg-primary/10" />
          <div className="h-4 w-36 animate-pulse rounded bg-primary/10" />
        </div>
        <div className="h-11 w-44 animate-pulse rounded-full bg-primary/10" />
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-3">
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-11/12 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-10/12 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-primary/15 bg-white p-6 md:p-8">
        <div className="h-6 w-40 animate-pulse rounded bg-primary/10" />
        <div className="space-y-3">
          <div className="h-14 animate-pulse bg-primary/5" />
          <div className="h-14 animate-pulse bg-primary/5" />
        </div>
      </div>
    </div>
  );
}
