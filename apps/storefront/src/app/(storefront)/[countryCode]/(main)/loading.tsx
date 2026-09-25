export default function Loading() {
  return (
    <div className="content-container py-10 lg:py-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-40 animate-pulse rounded bg-panel" />
          <div className="h-16 w-full animate-pulse rounded bg-panel" />
          <div className="h-24 w-full animate-pulse rounded bg-panel" />
          <div className="h-10 w-48 animate-pulse rounded bg-panel" />
        </div>
        <div className="aspect-video w-full animate-pulse rounded-[14px] border border-line bg-panel" />
      </div>

      <div className="mt-16 grid grid-cols-2 gap-5 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-[14px] border border-line bg-panel"
          />
        ))}
      </div>
    </div>
  )
}
