export default function Loading() {
  return (
    <div className="content-container py-10 lg:py-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square w-full animate-pulse rounded-[14px] border border-line bg-panel" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-panel" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-panel" />
          <div className="h-32 w-full animate-pulse rounded-lg bg-panel" />
          <div className="h-10 w-full animate-pulse rounded bg-panel" />
        </div>
      </div>
    </div>
  )
}
