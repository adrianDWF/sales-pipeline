import { PageHeaderSkeleton } from "@/components/common/page-skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="bg-muted/40 h-80 w-full max-w-xs animate-pulse rounded-xl lg:shrink-0" />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/40 h-20 animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="bg-muted/40 h-[min(24rem,calc(100vh-22rem))] animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}
