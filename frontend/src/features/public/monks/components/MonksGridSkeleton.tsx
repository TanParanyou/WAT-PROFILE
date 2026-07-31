export function MonksGridSkeleton() {
  return (
    <div className="grid grid-cols-1 border-t border-site-border md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse overflow-hidden border-b border-site-border bg-site-canvas md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
          <div className="aspect-[3/4] bg-site-surface" />
          <div className="p-6">
            <div className="h-4 w-28 bg-site-surface" />
            <div className="mt-3 h-6 w-40 bg-site-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
