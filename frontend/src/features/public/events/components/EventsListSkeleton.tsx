export function EventsListSkeleton() {
  return (
    <div className="grid border-t border-site-border">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="grid animate-pulse overflow-hidden border-b border-site-border bg-site-canvas md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-h-60 bg-site-surface" />
          <div className="p-6 md:p-8">
            <div className="h-4 w-40 bg-site-surface" />
            <div className="mt-5 h-7 w-3/4 bg-site-surface" />
            <div className="mt-4 h-4 w-full bg-site-surface" />
            <div className="mt-2 h-4 w-5/6 bg-site-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
