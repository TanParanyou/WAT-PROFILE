export function MonksGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="aspect-[3/4] bg-gray-200" />
          <div className="p-6">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="mt-3 h-6 w-40 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
