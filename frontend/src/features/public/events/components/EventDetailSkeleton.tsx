export function EventDetailSkeleton() {
  return (
    <div className="space-y-10" aria-label="Loading event">
      <div className="space-y-6 border-y border-site-border py-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-4 w-40 animate-pulse bg-site-surface" />
          <div className="h-4 w-28 animate-pulse bg-site-surface" />
          <div className="h-4 w-36 animate-pulse bg-site-surface" />
        </div>
        <div className="h-11 w-44 animate-pulse bg-site-surface" />
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-3">
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-11/12 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-10/12 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="space-y-4 border border-site-border bg-site-canvas p-6 md:p-8">
        <div className="h-6 w-40 animate-pulse bg-site-surface" />
        <div className="space-y-3">
          <div className="h-14 animate-pulse bg-site-surface" />
          <div className="h-14 animate-pulse bg-site-surface" />
        </div>
      </div>
    </div>
  );
}
