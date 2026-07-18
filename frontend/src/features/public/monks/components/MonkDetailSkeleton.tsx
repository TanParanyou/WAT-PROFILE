export function MonkDetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
          <div className="aspect-[3/4] bg-zinc-200" />
          <div className="space-y-3 p-6">
            <div className="h-10 w-10 rounded-full bg-zinc-200" />
            <div className="h-4 w-24 rounded bg-zinc-200" />
            <div className="h-5 w-40 rounded bg-zinc-200" />
          </div>
        </div>
      </div>
      <div className="space-y-5 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm md:p-12 lg:col-span-8">
        <div className="h-16 w-16 rounded bg-zinc-200" />
        <div className="h-10 w-64 rounded bg-zinc-200" />
        <div className="h-1.5 w-20 rounded bg-zinc-200" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full rounded bg-zinc-200" />
          <div className="h-4 w-11/12 rounded bg-zinc-200" />
          <div className="h-4 w-4/5 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
