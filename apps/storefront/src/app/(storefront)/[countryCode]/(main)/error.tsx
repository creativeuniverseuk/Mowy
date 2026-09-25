"use client"

import { useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function StorefrontError({
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
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-headline text-h2 text-chrome">
        Something went wrong
      </h1>
      <p className="max-w-md text-body-sm text-chrome-dim">
        We hit a snag loading this page. Nothing was charged and your cart is
        safe — try again, or head back to the shop.
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
          href="/"
          className="text-body-sm font-medium uppercase tracking-[0.08em] text-cobalt-soft hover:text-chrome"
        >
          Go to homepage
        </LocalizedClientLink>
      </div>
    </div>
  )
}
