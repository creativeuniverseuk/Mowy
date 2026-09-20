// Pure stock logic for the dashboard's low-stock panel, kept apart from the
// React page so it can be exercised without a browser.

export type StockStatus = "live" | "low" | "out"

export type InventoryLevel = {
  stocked_quantity?: number | null
  reserved_quantity?: number | null
}

export type VariantInventoryItem = {
  required_quantity?: number | null
  inventory?: { location_levels?: InventoryLevel[] | null } | null
}

// Units of one inventory item that can still be sold: stocked minus reserved,
// summed across every location, never below zero (an oversold location
// shouldn't cancel out stock held elsewhere into a negative number).
function itemAvailable(item: VariantInventoryItem): number {
  const levels = item.inventory?.location_levels ?? []
  const total = levels.reduce(
    (sum, level) =>
      sum + Number(level.stocked_quantity ?? 0) - Number(level.reserved_quantity ?? 0),
    0
  )
  const required = Number(item.required_quantity) > 0 ? Number(item.required_quantity) : 1

  return Math.max(0, Math.floor(total / required))
}

// A variant can be backed by several inventory items (kits/bundles), each
// needed in some quantity per sale — it's only as available as its scarcest
// item. A tracked variant with no inventory item at all can't be fulfilled,
// so it counts as 0 rather than being silently skipped.
export function variantAvailable(items: VariantInventoryItem[]): number {
  if (!items.length) return 0

  return Math.min(...items.map(itemAvailable))
}

export function stockStatus(available: number, threshold: number): StockStatus {
  if (available <= 0) return "out"
  if (available <= threshold) return "low"

  return "live"
}
