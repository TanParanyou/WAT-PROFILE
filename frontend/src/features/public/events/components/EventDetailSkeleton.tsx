export function EventDetailSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading event">
      <div className="aspect-video rounded-3xl bg-gray-200 animate-pulse" />
      <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap gap-4">
          <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="h-9 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-11/12 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 w-10/12 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>
      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
        <div className="space-y-3">
          <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
          <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
