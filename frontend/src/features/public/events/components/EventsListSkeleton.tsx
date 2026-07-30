export function EventsListSkeleton() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="grid animate-pulse overflow-hidden rounded-2xl border border-primary/15 bg-white md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-h-60 bg-primary/10" />
          <div className="p-6 md:p-8">
            <div className="h-4 w-40 rounded bg-primary/10" />
            <div className="mt-5 h-7 w-3/4 rounded bg-primary/10" />
            <div className="mt-4 h-4 w-full rounded bg-primary/10" />
            <div className="mt-2 h-4 w-5/6 rounded bg-primary/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
