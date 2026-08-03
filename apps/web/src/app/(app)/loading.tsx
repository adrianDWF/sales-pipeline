import { PageHeaderSkeleton } from "@/components/common/page-skeleton";

// Catch-all content skeleton for authenticated routes that do not define their
// own loading state. The persistent shell (sidebar + top nav) stays mounted;
// only this main-content area swaps while the route's server data resolves.
export default function AuthenticatedRouteLoading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="bg-muted mb-3 h-4 w-24 animate-pulse rounded" />
            <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
