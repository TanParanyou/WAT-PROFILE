export function EventsListSkeleton() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6">
          <div className="h-56 rounded-xl bg-gray-200" />
          <div className="mt-5 h-4 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-6 w-3/4 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-full rounded bg-gray-200" />
          <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
