export default function LeadDetailLoading() {
  return (
    <div className="space-y-5">
      <div className="bg-muted/40 h-8 w-40 animate-pulse rounded" />
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="bg-muted/40 h-32 animate-pulse rounded-xl" />
          <div className="bg-muted/40 h-10 w-full max-w-md animate-pulse rounded-lg" />
          <div className="bg-muted/40 h-96 animate-pulse rounded-xl" />
        </div>
        <div className="bg-muted/40 h-80 w-full animate-pulse rounded-xl xl:w-80" />
      </div>
    </div>
  );
}
