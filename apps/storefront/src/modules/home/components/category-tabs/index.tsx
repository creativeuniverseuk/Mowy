"use client"

import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

export type CategoryTab = {
  id: string
  name: string
  handle: string
  badge: string
}

const ARROW_BUTTON_CLASSES =
  "flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line text-chrome-dim transition-colors duration-200 hover:border-cobalt-soft hover:text-chrome disabled:pointer-events-none disabled:opacity-0"

/**
 * Category tabs styled like physical binder-divider tabs: rounded top
 * corners, square bottom corners, a coloured top strip — matching
 * design-reference/mowy-homepage.html's .cat-tab (see .tab-row/.cat-tab).
 *
 * The tab row scrolls horizontally; touch/trackpad gestures scroll it
 * natively, but a plain mouse wheel doesn't (a wheel's delta is vertical,
 * and the browser won't reinterpret it as horizontal scroll on its own).
 * The wheel handler below and the arrow buttons are two independent fixes
 * for that: the handler makes the undiscoverable mouse-wheel case work,
 * and the buttons give every user — including anyone who'd never think to
 * try the wheel here, or anyone who can't use a wheel/trackpad at all — a
 * visible, keyboard-and-click-operable way to move the row.
 */
export default function CategoryTabs({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: CategoryTab[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    // The -1 tolerates sub-pixel rounding, which can otherwise leave
    // scrollLeft a fraction short of the true max and strand the right
    // arrow visible with nowhere left to scroll.
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollState()

    // React registers onWheel as a passive listener, so e.preventDefault()
    // inside it is silently ignored (and logs a console warning) — hijacking
    // the page's vertical scroll to drive this row's horizontal scrollLeft
    // requires an explicitly non-passive native listener instead.
    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      // Only take over a genuinely vertical gesture (a mouse wheel) —
      // a trackpad's already-horizontal swipe should scroll natively.
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    el.addEventListener("scroll", updateScrollState, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      el.removeEventListener("wheel", handleWheel)
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [tabs, updateScrollState])

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Scroll categories left"
        disabled={!canScrollLeft}
        onClick={() => scrollByPage(-1)}
        className={`hidden sm:flex ${ARROW_BUTTON_CLASSES}`}
      >
        <ChevronLeft />
      </button>

      <div
        ref={scrollRef}
        className="no-scrollbar flex min-w-0 flex-1 gap-3.5 overflow-x-auto pb-1.5"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              aria-pressed={isActive}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`min-w-[168px] flex-none rounded-t-xl rounded-b border border-t-[3px] px-[18px] pb-4 pt-5 text-left transition-colors duration-200 ${
                isActive
                  ? "border-t-cobalt bg-panel-soft border-cobalt shadow-[0_0_0_1px_rgba(59,110,255,0.15)]"
                  : "border-t-line bg-panel border-line hover:border-t-cobalt-soft"
              }`}
            >
              <div
                className={`font-mono text-[10.5px] ${
                  isActive ? "text-cobalt-soft" : "text-chrome-dim"
                }`}
              >
                {tab.badge}
              </div>
              <h3
                className={`mt-1.5 text-h4 ${
                  isActive ? "text-chrome" : "text-chrome-dim"
                }`}
              >
                {tab.name}
              </h3>
            </motion.button>
          )
        })}
      </div>

      <button
        type="button"
        aria-label="Scroll categories right"
        disabled={!canScrollRight}
        onClick={() => scrollByPage(1)}
        className={`hidden sm:flex ${ARROW_BUTTON_CLASSES}`}
      >
        <ChevronRight />
      </button>
    </div>
  )
}
