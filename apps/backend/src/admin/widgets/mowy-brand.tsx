import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Text, Tooltip } from "@medusajs/ui"

const CHROME = "#e8e9ee"
const COBALT = "#3b6eff"
const INK = "#14141c"

/**
 * Hexagonal chrome "M" with a blue chevron (CLAUDE.md's brand identity).
 * Sits on its own fixed-ink chip rather than the admin's theme background —
 * chrome (#e8e9ee, near-white) reads fine on that ink chip in both admin
 * light and dark mode, but would nearly disappear as text/fill directly on
 * the admin's light-mode background, which is white. The chip makes the
 * mark's own contrast independent of the surrounding theme.
 */
function MowyMark() {
  return (
    <svg width={22} height={22} viewBox="0 0 40 40" aria-hidden>
      <rect width={40} height={40} rx={9} fill={INK} />
      <polygon
        points="20,4 33.86,12 33.86,28 20,36 6.14,28 6.14,12"
        fill="none"
        stroke={CHROME}
        strokeWidth={1.5}
      />
      <path
        d="M11,28 L11,14"
        stroke={CHROME}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M29,28 L29,14"
        stroke={CHROME}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M11,14 L20,23 L29,14"
        stroke={COBALT}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * There is no admin widget zone for the sidebar's own header (it's the
 * `Header` component in @medusajs/dashboard, showing the Store's name/
 * avatar — not hardcoded "Medusa" branding, and not exposed as an injection
 * zone in this Medusa version). "topbar" is the only zone that renders as
 * part of the authenticated shell chrome, alongside the notifications bell,
 * on every page — the closest real substitute available today.
 *
 * The sidebar header itself is fixed by the Store name setting instead
 * (Settings -> Store), which is what it actually reads.
 */
const MowyBrandWidget = () => {
  return (
    <Tooltip content="MOWY">
      <div className="flex items-center gap-x-1.5">
        <MowyMark />
        {/* `lg:inline` isn't in the admin bundle's precompiled CSS (see
            CLAUDE.md's Tailwind-in-admin-extensions gotcha) — `lg:block`
            is, and works identically for a single-line label. */}
        <Text size="small" weight="plus" className="hidden lg:block">
          MOWY
        </Text>
      </div>
    </Tooltip>
  )
}

export const config = defineWidgetConfig({
  zone: "topbar",
})

export default MowyBrandWidget
