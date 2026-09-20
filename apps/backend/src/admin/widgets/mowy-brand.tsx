import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Tooltip } from "@medusajs/ui"

import mowyLogoHeader from "./mowy-logo-header.png"

const INK = "#14141c"

/**
 * Real MOWY logo (hexagonal chrome "M" + blue chevron + wordmark,
 * design-reference/mowy-logo-header.png), replacing the from-scratch SVG
 * approximation built in Phase 6 before this asset existed.
 *
 * Still sits on its own fixed-ink chip rather than the admin's theme
 * background, for the same reason the SVG version did: the mark's chrome
 * tones are a near-white/silver gradient with a transparent background —
 * checked directly by compositing the actual PNG onto white, and the mark
 * all but disappears, leaving only the cobalt chevron floating. It reads
 * perfectly on dark (ink or admin dark mode), so the ink chip makes its
 * contrast independent of the surrounding theme instead of hoping the
 * asset happens to suit whichever theme is active.
 */
function MowyMark() {
  return (
    <img
      src={mowyLogoHeader}
      alt="MOWY"
      style={{ height: 20, width: "auto", display: "block" }}
    />
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
      <div
        className="flex items-center"
        style={{
          backgroundColor: INK,
          borderRadius: 8,
          padding: "6px 10px",
        }}
      >
        <MowyMark />
      </div>
    </Tooltip>
  )
}

export const config = defineWidgetConfig({
  zone: "topbar",
})

export default MowyBrandWidget
