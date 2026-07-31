export function MonkDetailSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="overflow-hidden border border-site-border bg-site-canvas">
          <div className="aspect-[3/4] bg-site-surface" />
          <div className="space-y-3 p-6">
            <div className="h-10 w-10 bg-site-surface" />
            <div className="h-4 w-24 bg-site-surface" />
            <div className="h-5 w-40 bg-site-surface" />
          </div>
        </div>
      </div>
      <div className="space-y-5 border border-site-border bg-site-canvas p-8 md:p-12 lg:col-span-8">
        <div className="h-10 w-64 bg-site-surface" />
        <div className="space-y-3 pt-4">
          <div className="h-4 w-full bg-site-surface" />
          <div className="h-4 w-11/12 bg-site-surface" />
          <div className="h-4 w-4/5 bg-site-surface" />
        </div>
      </div>
    </div>
  );
}
