"use client"

import { useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-headline text-h2 text-chrome">
        Checkout hit a snag
      </h1>
      <p className="max-w-md text-body-sm text-chrome-dim">
        Nothing was charged. Your cart is untouched — try again, or head back
        to your bag to double-check it before retrying.
      </p>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-base bg-cobalt-deep px-6 py-3 text-body-sm font-medium uppercase tracking-[0.08em] text-chrome transition-colors hover:bg-cobalt-deep/90"
        >
          Try again
        </button>
        <LocalizedClientLink
          href="/cart"
          className="text-body-sm font-medium uppercase tracking-[0.08em] text-cobalt-soft hover:text-chrome"
        >
          Back to your bag
        </LocalizedClientLink>
      </div>
    </div>
  )
}
