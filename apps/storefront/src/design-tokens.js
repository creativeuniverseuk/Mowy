/**
 * MOWY design tokens — single source of truth.
 *
 * CommonJS so tailwind.config.js can `require()` it directly; re-exported
 * with types from `src/lib/design-tokens.ts` for use in app code.
 *
 * Hex values for `ink`/`chrome`/`cobalt` and the semantic status colours
 * come from CLAUDE.md and /design-reference. `hsl` mirrors are precomputed
 * because shadcn/ui's component primitives consume `hsl(var(--token))`.
 */

const colors = {
  // Core brand
  ink: { hex: "#14141c", hsl: "240 17% 9%" },
  chrome: { hex: "#e8e9ee", hsl: "230 15% 92%" },
  cobalt: { hex: "#3b6eff", hsl: "224 100% 62%" },

  // Surfaces & borders (extend the core palette, sourced from
  // /design-reference mockups for a consistent dark UI)
  "ink-2": { hex: "#1a1a24", hsl: "234 14% 12%" },
  panel: { hex: "#1f2029", hsl: "234 14% 14%" },
  "panel-soft": { hex: "#23242f", hsl: "235 15% 16%" },
  line: { hex: "#33333f", hsl: "240 11% 22%" },
  "chrome-dim": { hex: "#9a9ba8", hsl: "236 7% 63%" },
  "cobalt-soft": { hex: "#6e93ff", hsl: "225 100% 72%" },
  // Solid CTA-button fill only — `cobalt` itself is 3.56:1 against `chrome`
  // text (fails WCAG AA 4.5:1 for the 14px/medium-weight labels these
  // buttons actually use, which don't qualify for the large-text 3:1
  // exception). `cobalt-deep` measures ~4.68:1 against `chrome`. Never use
  // for links/borders/focus rings — those keep `cobalt`/`cobalt-soft`.
  "cobalt-deep": { hex: "#345fd1", hsl: "226 66% 51%" },

  // Stock status — semantic only, never reused for brand chrome
  live: { hex: "#7fd68a", hsl: "128 51% 67%" },
  "low-stock": { hex: "#e0a83f", hsl: "39 72% 56%" },
  "out-of-stock": { hex: "#e2716f", hsl: "1 66% 66%" },

  // Holo/foil gradient stops — decorative accent for card-foil moments
  // (headline emphasis, sheen sweeps), not a general-purpose UI colour
  "holo-a": { hex: "#ffffff", hsl: "0 0% 100%" },
  "holo-b": { hex: "#b9c2d0", hsl: "215 20% 78%" },
  "holo-c": { hex: "#3b6eff", hsl: "224 100% 62%" },
}

const fonts = {
  headline: "var(--font-space-grotesk)",
  body: "var(--font-inter)",
  mono: "var(--font-jetbrains-mono)",
}

const radius = {
  sm: "8px",
  DEFAULT: "14px",
  lg: "16px",
  full: "9999px",
}

module.exports = { colors, fonts, radius }
