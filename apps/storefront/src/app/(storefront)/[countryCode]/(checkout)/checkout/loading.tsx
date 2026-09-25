export default function Loading() {
  return (
    <div className="grid grid-cols-1 content-container gap-x-10 gap-y-8 py-12 small:grid-cols-[1fr_416px]">
      <div className="rounded-large border border-line bg-ink-2">
        <div className="border-b border-dashed border-line px-6 py-5 small:px-10">
          <div className="h-3 w-32 animate-pulse rounded bg-panel" />
          <div className="mt-2 h-8 w-40 animate-pulse rounded bg-panel" />
        </div>
        <div className="flex flex-col gap-y-4 px-6 py-6 small:px-10">
          <div className="h-24 w-full animate-pulse rounded-lg border border-line bg-panel" />
          <div className="h-24 w-full animate-pulse rounded-lg border border-line bg-panel" />
          <div className="h-24 w-full animate-pulse rounded-lg border border-line bg-panel" />
        </div>
      </div>
      <div className="relative">
        <div className="sticky top-12 flex flex-col gap-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-panel" />
          <div className="h-48 w-full animate-pulse rounded-lg border border-line bg-panel" />
        </div>
      </div>
    </div>
  )
}
