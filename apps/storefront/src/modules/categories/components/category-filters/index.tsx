"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  CARD_FACET_FIELDS,
  CardFacetField,
  FacetDistribution,
  parseCsvParam,
} from "@lib/util/card-facets"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const FACET_LABELS: Record<CardFacetField, string> = {
  card_set: "Set",
  rarity: "Rarity",
  condition: "Condition",
}

const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
]

export default function CategoryFilters({
  facetDistribution,
}: {
  facetDistribution: FacetDistribution
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [queryInput, setQueryInput] = useState(searchParams.get("q") ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const isFirstRender = useRef(true)

  const activeFacets: Record<CardFacetField, string[]> = {
    card_set: parseCsvParam(searchParams.get("card_set")),
    rarity: parseCsvParam(searchParams.get("rarity")),
    condition: parseCsvParam(searchParams.get("condition")),
  }
  const sortBy = (searchParams.get("sortBy") as SortOptions) || "created_at"

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.set("page", "1")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  // Debounced instant search — pushes ~350ms after the user stops typing.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParams((params) => {
        if (queryInput) params.set("q", queryInput)
        else params.delete("q")
      })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput])

  const toggleFacet = (field: CardFacetField, value: string) => {
    pushParams((params) => {
      const current = new Set(parseCsvParam(params.get(field)))
      if (current.has(value)) {
        current.delete(value)
      } else {
        current.add(value)
      }
      if (current.size) {
        params.set(field, Array.from(current).join(","))
      } else {
        params.delete(field)
      }
    })
  }

  const handleSortChange = (value: SortOptions) => {
    pushParams((params) => params.set("sortBy", value))
  }

  const hasActiveFilters =
    Boolean(queryInput) || CARD_FACET_FIELDS.some((f) => activeFacets[f].length)

  const clearAll = () => {
    setQueryInput("")
    router.push(pathname)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <label
          htmlFor="category-search"
          className="mb-2 block font-mono text-xs uppercase tracking-[0.12em] text-chrome-dim"
        >
          Search this set
        </label>
        <input
          id="category-search"
          type="search"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search by name, set, SKU..."
          className="w-full rounded-[9px] border border-line bg-panel px-4 py-3 text-sm text-chrome placeholder:text-chrome-dim focus:border-cobalt-soft focus:outline-none"
        />
      </div>

      <div>
        <span className="mb-2 block font-mono text-xs uppercase tracking-[0.12em] text-chrome-dim">
          Sort by
        </span>
        <div className="flex flex-col gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSortChange(opt.value)}
              className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                sortBy === opt.value
                  ? "bg-panel-soft text-chrome"
                  : "text-chrome-dim hover:text-chrome"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {CARD_FACET_FIELDS.map((field) => {
        const distribution = facetDistribution[field]
        const options: [string, number][] = distribution
          ? distribution.values
              .map((v) => [v.value, v.count] as [string, number])
              .sort((a, b) => b[1] - a[1])
          : []

        if (!options.length) return null

        return (
          <div key={field}>
            <span className="mb-2 block font-mono text-xs uppercase tracking-[0.12em] text-chrome-dim">
              {FACET_LABELS[field]}
            </span>
            <div className="flex flex-col gap-1">
              {options.map(([value, count]) => {
                const checked = activeFacets[field].includes(value)
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1.5 text-sm"
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFacet(field, value)}
                        className="h-4 w-4 rounded border-line bg-panel accent-cobalt"
                      />
                      <span className={checked ? "text-chrome" : "text-chrome-dim"}>
                        {value}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-chrome-dim">
                      {count}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="self-start font-mono text-xs uppercase tracking-[0.1em] text-cobalt-soft hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
