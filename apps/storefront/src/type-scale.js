/**
 * MOWY typography scale — single source of truth (CommonJS, see
 * src/design-tokens.js for why). Re-exported with types from
 * `src/lib/typography.ts`.
 *
 * Headlines: Space Grotesk · Body: Inter · Price tags / SKUs: JetBrains Mono
 */

const { fonts } = require("./design-tokens.js")

const typeScale = {
  display: {
    fontFamily: fonts.headline,
    fontSize: "3.5rem",
    lineHeight: "1.05",
    letterSpacing: "-0.02em",
    fontWeight: "600",
    use: "Hero headlines",
  },
  h1: {
    fontFamily: fonts.headline,
    fontSize: "2.5rem",
    lineHeight: "1.1",
    letterSpacing: "-0.01em",
    fontWeight: "600",
    use: "Page titles",
  },
  h2: {
    fontFamily: fonts.headline,
    fontSize: "2rem",
    lineHeight: "1.15",
    letterSpacing: "-0.01em",
    fontWeight: "600",
    use: "Section headings",
  },
  h3: {
    fontFamily: fonts.headline,
    fontSize: "1.5rem",
    lineHeight: "1.2",
    letterSpacing: "-0.01em",
    fontWeight: "500",
    use: "Card / subsection headings",
  },
  h4: {
    fontFamily: fonts.headline,
    fontSize: "1.25rem",
    lineHeight: "1.3",
    letterSpacing: "0em",
    fontWeight: "500",
    use: "Minor headings, labels",
  },
  "body-lg": {
    fontFamily: fonts.body,
    fontSize: "1.125rem",
    lineHeight: "1.6",
    letterSpacing: "0em",
    fontWeight: "400",
    use: "Lead paragraphs",
  },
  body: {
    fontFamily: fonts.body,
    fontSize: "1rem",
    lineHeight: "1.6",
    letterSpacing: "0em",
    fontWeight: "400",
    use: "Default body copy",
  },
  "body-sm": {
    fontFamily: fonts.body,
    fontSize: "0.875rem",
    lineHeight: "1.5",
    letterSpacing: "0em",
    fontWeight: "400",
    use: "Secondary copy, form hints",
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: "0.75rem",
    lineHeight: "1.4",
    letterSpacing: "0.01em",
    fontWeight: "500",
    use: "Captions, meta text (pairs with chrome-dim)",
  },
  "mono-price": {
    fontFamily: fonts.mono,
    fontSize: "1.125rem",
    lineHeight: "1.2",
    letterSpacing: "0.02em",
    fontWeight: "600",
    use: "Price tags",
  },
  "mono-sku": {
    fontFamily: fonts.mono,
    fontSize: "0.75rem",
    lineHeight: "1.4",
    letterSpacing: "0.03em",
    fontWeight: "500",
    use: "SKUs, set codes, order numbers",
  },
}

module.exports = { typeScale }
