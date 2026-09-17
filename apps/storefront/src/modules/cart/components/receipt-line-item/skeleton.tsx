const ReceiptLineItemSkeleton = () => {
  return (
    <div className="flex gap-4 border-b border-dashed border-line py-4 last:border-b-0">
      <div className="h-16 w-16 shrink-0 animate-pulse rounded-large bg-panel" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="h-4 w-32 animate-pulse rounded-soft bg-panel" />
          <div className="h-4 w-14 animate-pulse rounded-soft bg-panel" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 animate-pulse rounded-base bg-panel" />
          <div className="h-4 w-12 animate-pulse rounded-soft bg-panel" />
        </div>
      </div>
    </div>
  )
}

export default ReceiptLineItemSkeleton
