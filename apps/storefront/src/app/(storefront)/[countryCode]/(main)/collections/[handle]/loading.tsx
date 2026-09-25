export default function Loading() {
  return (
    <div className="content-container py-10 lg:py-14">
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-panel" />
      <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
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
