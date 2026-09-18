/**
 * pull_pool has no colour field of its own (see lib/data/mystery-pulls.ts) —
 * every pack's accent is the rarest currently-pullable outcome's
 * rarity_color, a single hex. The pack art / glow needs a soft, lighter
 * companion tone too (mirroring design-reference's --theme/--theme-soft
 * pair), so this derives one instead of storing a second colour anywhere.
 */
export function lightenHex(hex: string, amount: number): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) {
    return hex
  }

  const num = parseInt(match[1], 16)
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)

  const r = mix((num >> 16) & 0xff)
  const g = mix((num >> 8) & 0xff)
  const b = mix(num & 0xff)

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
