export default function Loading() {
  return (
    <div className="content-container py-16 lg:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <div className="h-10 w-2/3 animate-pulse rounded bg-panel" />
        <div className="h-4 w-full animate-pulse rounded bg-panel" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-panel" />
      </div>
      <div className="mt-16 h-64 w-full animate-pulse rounded-[14px] border border-line bg-panel" />
    </div>
  )
}
