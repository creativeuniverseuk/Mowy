"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

export default function CategoryPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goTo = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, i) => start + i)

  const renderButton = (p: number) => (
    <button
      key={p}
      type="button"
      disabled={p === page}
      onClick={() => goTo(p)}
      className={`h-9 min-w-9 rounded-md px-2 font-mono text-sm transition-colors ${
        p === page
          ? "bg-cobalt-deep text-chrome"
          : "text-chrome-dim hover:bg-panel-soft hover:text-chrome"
      }`}
    >
      {p}
    </button>
  )

  const renderEllipsis = (key: string) => (
    <span key={key} className="px-1 text-chrome-dim">
      &hellip;
    </span>
  )

  const buttons: ReactNode[] = []

  if (totalPages <= 7) {
    buttons.push(...arrayRange(1, totalPages).map(renderButton))
  } else if (page <= 4) {
    buttons.push(...arrayRange(1, 5).map(renderButton))
    buttons.push(renderEllipsis("e1"), renderButton(totalPages))
  } else if (page >= totalPages - 3) {
    buttons.push(renderButton(1), renderEllipsis("e2"))
    buttons.push(...arrayRange(totalPages - 4, totalPages).map(renderButton))
  } else {
    buttons.push(renderButton(1), renderEllipsis("e3"))
    buttons.push(...arrayRange(page - 1, page + 1).map(renderButton))
    buttons.push(renderEllipsis("e4"), renderButton(totalPages))
  }

  return (
    <div className="mt-12 flex justify-center gap-1">{buttons}</div>
  )
}
