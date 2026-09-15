import raw from "../design-tokens.js"

export type ColorToken = keyof typeof raw.colors

export const colors: Record<ColorToken, { hex: string; hsl: string }> =
  raw.colors

export const fonts: { headline: string; body: string; mono: string } =
  raw.fonts

export const radius: Record<"sm" | "DEFAULT" | "lg" | "full", string> =
  raw.radius

/** Status colours only — never repurpose these for brand chrome or generic UI accents. */
export const stockStatusColors = {
  live: colors.live,
  "low-stock": colors["low-stock"],
  "out-of-stock": colors["out-of-stock"],
} as const
