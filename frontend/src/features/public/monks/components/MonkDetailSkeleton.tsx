export function MonkDetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm">
          <div className="aspect-[3/4] bg-primary/10" />
          <div className="space-y-3 p-6">
            <div className="h-10 w-10 rounded-full bg-primary/10" />
            <div className="h-4 w-24 rounded bg-primary/10" />
            <div className="h-5 w-40 rounded bg-primary/10" />
          </div>
        </div>
      </div>
      <div className="space-y-5 rounded-2xl border border-primary/15 bg-white p-8 md:p-12 lg:col-span-8">
        <div className="h-10 w-64 rounded bg-primary/10" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full rounded bg-primary/10" />
          <div className="h-4 w-11/12 rounded bg-primary/10" />
          <div className="h-4 w-4/5 rounded bg-primary/10" />
        </div>
      </div>
    </div>
  );
}
