export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <div className="bg-muted h-3 w-24 animate-pulse rounded" />
      <div className="bg-muted h-8 w-56 animate-pulse rounded" />
      <div className="bg-muted h-4 w-80 max-w-full animate-pulse rounded" />
    </div>
  );
}

export function IntegrationsPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        <div className="bg-muted h-5 w-32 animate-pulse rounded" />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <div className="bg-muted mb-3 size-10 animate-pulse rounded-lg" />
              <div className="bg-muted mb-2 h-5 w-40 animate-pulse rounded" />
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeoPageSkeleton() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-8 w-24 animate-pulse rounded-md" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="bg-muted mb-3 h-5 w-40 animate-pulse rounded" />
            <div className="bg-muted mb-2 h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientDetailContentSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="flex justify-between gap-4">
          <div className="space-y-2">
            <div className="bg-muted h-8 w-48 animate-pulse rounded" />
            <div className="bg-muted h-4 w-64 animate-pulse rounded" />
            <div className="bg-muted h-3 w-80 max-w-full animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="bg-muted h-9 w-32 animate-pulse rounded-md" />
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-14 w-36 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted h-8 w-20 animate-pulse rounded" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card px-4 py-3">
            <div className="bg-muted h-3 w-20 animate-pulse rounded" />
            <div className="bg-muted mt-3 h-8 w-24 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="flex min-h-svh bg-background">
      <div className="bg-muted/40 hidden min-h-svh w-[45%] shrink-0 lg:block" />
      <div className="flex min-h-svh flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
          <div className="bg-muted mb-8 h-8 w-24 animate-pulse rounded" />
          <div className="bg-muted mb-8 h-10 w-48 animate-pulse rounded-full" />
          <div className="mb-6 space-y-2">
            <div className="bg-muted h-8 w-56 animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
          </div>
          <div className="bg-muted mb-6 h-11 w-full animate-pulse rounded-lg" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                <div className="bg-muted h-11 w-full animate-pulse rounded-lg" />
              </div>
            ))}
            <div className="bg-muted h-11 w-full animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
