export default function Loading() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-12 text-fg sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header skeleton */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="mb-6 h-4 w-32 animate-pulse rounded bg-bg-soft" />
          <div className="h-10 w-64 animate-pulse rounded bg-bg-soft" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-bg-soft" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-bg-soft" />

          <div className="my-8 h-24 w-full animate-pulse rounded-xl bg-bg-soft" />

          <div className="mt-8 h-6 w-48 animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-full animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-9/12 animate-pulse rounded bg-bg-soft" />

          <div className="mt-8 h-6 w-56 animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-full animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-bg-soft" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-bg-soft" />
        </div>
      </div>
    </main>
  );
}
