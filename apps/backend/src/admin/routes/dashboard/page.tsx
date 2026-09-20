import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Badge,
  Container,
  Heading,
  Input,
  Label,
  StatusBadge,
  Switch,
  Table,
  Text,
} from "@medusajs/ui"

import { ChartBarIcon } from "./chart-bar-icon"
import {
  StockStatus,
  VariantInventoryItem,
  stockStatus,
  variantAvailable,
} from "./stock"

const DEFAULT_LOW_STOCK_THRESHOLD = 5
const DEFAULT_CURRENCY = "gbp"
const TABLE_PAGE_SIZE = 10

// Lists are read a page at a time. The cap keeps a runaway catalogue/order
// history from turning one dashboard load into thousands of requests — past
// it the figures are flagged as partial rather than silently wrong.
const API_PAGE_SIZE = 100
const MAX_API_PAGES = 50

// One row of the low-stock table: either a Medusa inventory variant or a
// Mystery Pull outcome. Both are judged by the same threshold and pills.
type StockRow = {
  key: string
  source: "inventory" | "pull"
  productId: string
  product: string
  variant: string
  sku: string | null
  available: number
}

// Shape returned by src/api/admin/mystery-pulls/stock/route.ts.
type PullStockItem = {
  key: string
  product_id: string
  product_title: string
  rarity_tier: string | null
  prize_title: string | null
  prize_sku: string | null
  remaining_qty: number
}

type RevenueResult = {
  totals: Record<string, number>
  truncated: boolean
}

async function fetchJson(url: string) {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Request to ${url} failed (${res.status}).`)
  }
  return res.json()
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth() {
  const d = startOfToday()
  d.setDate(1)
  return d
}

const formatNumber = (n: number) => new Intl.NumberFormat("en-GB").format(n)

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount)

async function fetchCount(path: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ limit: "1", fields: "id", ...extra })
  const { count } = await fetchJson(`${path}?${params}`)
  return count as number
}

// Net cash for the month: what was paid minus what was refunded, per
// currency. Orders sit at status "pending" even once captured, so payment
// figures — not order status — are what say whether money actually came in.
// Cancelled orders are left out; amounts are already in major units (£645,
// not 64500p).
async function fetchMonthRevenue(): Promise<RevenueResult> {
  const totals: Record<string, number> = {}
  const since = startOfMonth().toISOString()
  let count = Infinity
  let page = 0

  for (; page < MAX_API_PAGES && page * API_PAGE_SIZE < count; page++) {
    const params = new URLSearchParams({
      limit: String(API_PAGE_SIZE),
      offset: String(page * API_PAGE_SIZE),
      fields:
        "id,currency_code,status,summary.paid_total,summary.refunded_total,-items",
      "created_at[$gte]": since,
    })
    const data = await fetchJson(`/admin/orders?${params}`)
    count = data.count

    for (const order of data.orders ?? []) {
      if (order.status === "canceled") continue

      const net =
        Number(order.summary?.paid_total ?? 0) -
        Number(order.summary?.refunded_total ?? 0)
      const currency = order.currency_code ?? DEFAULT_CURRENCY
      totals[currency] = (totals[currency] ?? 0) + net
    }
  }

  for (const currency of Object.keys(totals)) {
    totals[currency] = Math.round(totals[currency] * 100) / 100
  }

  return { totals, truncated: page * API_PAGE_SIZE < count }
}

// Only variants with inventory management switched on are tracked; the rest
// (single-copy pull prizes, pack products, sandbox items) have no stock
// figure to report on.
async function fetchTrackedVariants(): Promise<StockRow[]> {
  const rows: StockRow[] = []
  let count = Infinity

  for (let page = 0; page < MAX_API_PAGES && page * API_PAGE_SIZE < count; page++) {
    const params = new URLSearchParams({
      limit: String(API_PAGE_SIZE),
      offset: String(page * API_PAGE_SIZE),
      fields: [
        "id",
        "title",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.manage_inventory",
        "variants.inventory_items.required_quantity",
        "variants.inventory_items.inventory.location_levels.stocked_quantity",
        "variants.inventory_items.inventory.location_levels.reserved_quantity",
      ].join(","),
    })
    const data = await fetchJson(`/admin/products?${params}`)
    count = data.count

    for (const product of data.products ?? []) {
      for (const variant of product.variants ?? []) {
        if (!variant.manage_inventory) continue

        rows.push({
          key: variant.id,
          source: "inventory",
          productId: product.id,
          product: product.title,
          variant: variant.title,
          sku: variant.sku ?? null,
          available: variantAvailable(
            (variant.inventory_items ?? []) as VariantInventoryItem[]
          ),
        })
      }
    }
  }

  return rows
}

// Mystery Pull copies aren't Medusa inventory: each outcome's stock is its
// own `remaining_qty`, so it comes from a dedicated route rather than the
// inventory API above.
async function fetchPullStock(): Promise<StockRow[]> {
  const { items } = (await fetchJson("/admin/mystery-pulls/stock")) as {
    items: PullStockItem[]
  }

  return items.map((item) => ({
    key: item.key,
    source: "pull",
    productId: item.product_id,
    product: item.product_title,
    variant: item.rarity_tier
      ? item.prize_title
        ? `${item.rarity_tier} · ${item.prize_title}`
        : item.rarity_tier
      : "No outcomes set up",
    sku: item.prize_sku,
    available: item.remaining_qty,
  }))
}

const STATUS_PILL: Record<
  StockStatus,
  { label: string; color: "green" | "orange" | "red" }
> = {
  live: { label: "Live", color: "green" },
  low: { label: "Low stock", color: "orange" },
  out: { label: "Out of stock", color: "red" },
}

const DashboardPage = () => {
  const [thresholdInput, setThresholdInput] = useState(
    String(DEFAULT_LOW_STOCK_THRESHOLD)
  )
  const [showInStock, setShowInStock] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)

  // Anything that isn't a whole number >= 0 (empty, mid-typing) falls back to
  // the default rather than breaking the panel.
  const parsed = Number(thresholdInput)
  const threshold =
    thresholdInput.trim() !== "" && Number.isInteger(parsed) && parsed >= 0
      ? parsed
      : DEFAULT_LOW_STOCK_THRESHOLD

  // Keyed on the calendar day so "today" is recomputed after midnight.
  const dayKey = startOfToday().toDateString()

  const products = useQuery({
    queryKey: ["mowy-dashboard", "products-count"],
    queryFn: () => fetchCount("/admin/products"),
  })

  const ordersToday = useQuery({
    queryKey: ["mowy-dashboard", "orders-today", dayKey],
    queryFn: () =>
      fetchCount("/admin/orders", {
        "created_at[$gte]": startOfToday().toISOString(),
      }),
  })

  const revenue = useQuery({
    queryKey: ["mowy-dashboard", "revenue-month", dayKey],
    queryFn: fetchMonthRevenue,
  })

  const inventory = useQuery({
    queryKey: ["mowy-dashboard", "tracked-variants"],
    queryFn: fetchTrackedVariants,
  })

  const pullStock = useQuery({
    queryKey: ["mowy-dashboard", "pull-stock"],
    queryFn: fetchPullStock,
  })

  // Regular variants and Mystery Pull outcomes share one list and one
  // threshold, so nothing that can run out is left off it. If only one source
  // fails to load the other still shows, with a warning saying which is
  // missing — a silently partial list would be the very thing this panel
  // exists to prevent.
  const tracked = [...(inventory.data ?? []), ...(pullStock.data ?? [])]
  const stockPending = inventory.isPending || pullStock.isPending
  const stockFailed = inventory.isError && pullStock.isError
  const stockWarning =
    inventory.isError && !pullStock.isError
      ? "Inventory couldn't be loaded — showing Mystery Pull stock only."
      : pullStock.isError && !inventory.isError
        ? "Mystery Pull stock couldn't be loaded — showing inventory only."
        : null

  const needsAttention = tracked.filter(
    (row) => stockStatus(row.available, threshold) !== "live"
  )
  const outOfStock = needsAttention.filter((row) => row.available <= 0)

  const rows = (showInStock ? tracked : needsAttention)
    .slice()
    .sort(
      (a, b) =>
        a.available - b.available ||
        a.product.localeCompare(b.product) ||
        a.variant.localeCompare(b.variant)
    )

  const pageCount = Math.max(1, Math.ceil(rows.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(pageIndex, pageCount - 1)
  const pageRows = rows.slice(
    currentPage * TABLE_PAGE_SIZE,
    (currentPage + 1) * TABLE_PAGE_SIZE
  )

  useEffect(() => {
    setPageIndex(0)
  }, [threshold, showInStock])

  const revenueEntries = Object.entries(revenue.data?.totals ?? {})
  const revenueValue = revenue.data
    ? (revenueEntries.length
        ? revenueEntries
        : ([[DEFAULT_CURRENCY, 0]] as [string, number][])
      )
        .map(([currency, amount]) => formatMoney(amount, currency))
        .join(" · ")
    : null

  return (
    <div className="flex flex-col gap-y-3">
      {/* Inline template, not `sm:grid-cols-2 xl:grid-cols-4`: extension code
          only gets the Tailwind classes the dashboard's precompiled CSS
          already contains, and those responsive utilities aren't in it. This
          gives four across when there's room, wrapping down to one. */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        <StatCard
          label="Total products"
          value={products.data != null ? formatNumber(products.data) : null}
          caption="All statuses"
          isLoading={products.isPending}
          isError={products.isError}
        />
        <StatCard
          label="Orders today"
          value={ordersToday.data != null ? formatNumber(ordersToday.data) : null}
          caption="Since midnight"
          isLoading={ordersToday.isPending}
          isError={ordersToday.isError}
        />
        <StatCard
          label="Revenue this month"
          value={revenueValue}
          caption={
            revenue.data?.truncated
              ? `Partial — first ${formatNumber(API_PAGE_SIZE * MAX_API_PAGES)} orders`
              : "Net of refunds"
          }
          isLoading={revenue.isPending}
          isError={revenue.isError}
        />
        <StatCard
          label="Low stock"
          value={
            !stockPending && !stockFailed ? formatNumber(needsAttention.length) : null
          }
          caption={
            stockWarning ??
            (!stockPending && !stockFailed
              ? tracked.length
                ? `${formatNumber(outOfStock.length)} out of stock · at or below ${threshold}`
                : "Nothing tracked yet"
              : undefined)
          }
          captionIsError={stockWarning != null}
          isLoading={stockPending}
          isError={stockFailed}
        />
      </div>

      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Heading level="h2">Low stock</Heading>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-x-2">
              <Label size="small" weight="plus" htmlFor="low-stock-threshold">
                Threshold
              </Label>
              <Input
                id="low-stock-threshold"
                type="number"
                min={0}
                step={1}
                size="small"
                className="w-20"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-x-2">
              <Switch
                id="show-in-stock"
                checked={showInStock}
                onCheckedChange={setShowInStock}
              />
              <Label size="small" weight="plus" htmlFor="show-in-stock">
                Show in-stock variants
              </Label>
            </div>
          </div>
        </div>

        {stockWarning && (
          <div className="px-6 py-3">
            <Text size="small" className="text-ui-fg-error">
              {stockWarning}
            </Text>
          </div>
        )}

        {stockPending ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">
              Loading stock…
            </Text>
          </div>
        ) : stockFailed ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-error">
              Stock couldn't be loaded. Refresh the page to try again.
            </Text>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">
              {tracked.length
                ? `Nothing is at or below ${threshold} — every tracked variant and pull outcome is stocked.`
                : "No variants track inventory and no Mystery Pull pools are active, so there is no stock to report."}
            </Text>
          </div>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell>Variant</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Available</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {pageRows.map((row) => {
                  const pill = STATUS_PILL[stockStatus(row.available, threshold)]

                  return (
                    <Table.Row key={row.key}>
                      <Table.Cell>
                        <div className="flex items-center gap-x-2">
                          <Link
                            to={`/products/${row.productId}`}
                            className="text-ui-fg-base hover:text-ui-fg-interactive transition-fg"
                          >
                            {row.product}
                          </Link>
                          {/* Grey on purpose: green/orange/red are reserved
                              for stock state, so the marker can't be mistaken
                              for a status. */}
                          {row.source === "pull" && (
                            <Badge size="2xsmall" color="grey">
                              Mystery Pull
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>{row.variant}</Table.Cell>
                      <Table.Cell>{row.sku ?? "-"}</Table.Cell>
                      <Table.Cell className="text-right">
                        {formatNumber(row.available)}
                      </Table.Cell>
                      <Table.Cell>
                        <StatusBadge color={pill.color}>{pill.label}</StatusBadge>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
            <Table.Pagination
              count={rows.length}
              pageSize={TABLE_PAGE_SIZE}
              pageIndex={currentPage}
              pageCount={pageCount}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < pageCount - 1}
              previousPage={() => setPageIndex(currentPage - 1)}
              nextPage={() => setPageIndex(currentPage + 1)}
            />
          </>
        )}
      </Container>
    </div>
  )
}

function StatCard({
  label,
  value,
  caption,
  captionIsError,
  isLoading,
  isError,
}: {
  label: string
  value: string | null
  caption?: string
  // For a card that still has a value but wants to flag it as incomplete.
  captionIsError?: boolean
  isLoading: boolean
  isError: boolean
}) {
  return (
    <Container className="flex flex-col gap-y-1 p-6">
      <Text size="small" weight="plus" leading="compact" className="text-ui-fg-subtle">
        {label}
      </Text>
      {isLoading ? (
        <div className="bg-ui-bg-component my-1 h-8 w-24 animate-pulse rounded-md" />
      ) : (
        <Heading level="h1">{isError ? "-" : value}</Heading>
      )}
      <Text
        size="xsmall"
        leading="compact"
        className={isError || captionIsError ? "text-ui-fg-error" : "text-ui-fg-muted"}
      >
        {isError ? "Couldn't load" : caption ?? " "}
      </Text>
    </Container>
  )
}

// `rank: 0` puts this first among custom sidebar items. Medusa renders those
// after every core route (Orders, Products, ...) and `rank` only orders them
// against each other, so this can't sit above the core items from code — a
// user can drag it up themselves in the sidebar's edit mode.
export const config = defineRouteConfig({
  label: "Dashboard",
  icon: ChartBarIcon,
  rank: 0,
})

export default DashboardPage
