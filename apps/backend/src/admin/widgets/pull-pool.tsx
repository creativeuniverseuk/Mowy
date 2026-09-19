import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/types"
import { useEffect, useMemo, useState } from "react"
import {
  Button,
  Container,
  Heading,
  Text,
  Input,
  Label,
  Switch,
  Select,
  Table,
  Badge,
  toast,
  usePrompt,
} from "@medusajs/ui"

// Duplicated from apps/backend/src/modules/mystery_pull/index.ts rather than
// imported: this file is bundled separately by the admin dashboard's own
// Vite build, which doesn't reach outside src/admin. The storefront already
// keeps its own copy of this same handle (lib/constants.tsx) for the same
// reason — an accepted pattern in this codebase, not an oversight.
const MYSTERY_PULLS_CATEGORY_HANDLE = "mystery-pulls"

type Pool = {
  id: string
  theme_key: string
  pack_art_url: string | null
  is_active: boolean
}

type Outcome = {
  id: string
  rarity_tier: string
  rarity_color: string
  weight: number
  remaining_qty: number
  product_id: string | null
  variant_id: string | null
  product_title: string | null
  product_thumbnail: string | null
  variant_title: string | null
}

type ProductSearchResult = {
  id: string
  title: string
  thumbnail: string | null
  variants: { id: string; title: string }[]
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Request to ${url} failed (${res.status}).`)
  }
  if (res.status === 204) return null
  return res.json()
}

// Mirrors apps/backend/src/api/store/mystery-pulls/[pool_id]/odds/route.ts's
// formula exactly, so what a family member sees here previewing a pool
// matches what a customer sees on the live odds box.
function computeLiveOdds(outcomes: Outcome[]): Record<string, number> {
  const eligible = outcomes.filter((o) => Number(o.remaining_qty) > 0)
  const totalWeight = eligible.reduce((sum, o) => sum + Number(o.weight || 0), 0)
  const result: Record<string, number> = {}
  for (const o of outcomes) {
    const isEligible = Number(o.remaining_qty) > 0
    result[o.id] =
      isEligible && totalWeight > 0 ? (Number(o.weight) / totalWeight) * 100 : 0
  }
  return result
}

const PullPoolWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [loading, setLoading] = useState(true)
  const [isMysteryPullProduct, setIsMysteryPullProduct] = useState(false)
  const [pool, setPool] = useState<Pool | null>(null)
  const [savedOutcomes, setSavedOutcomes] = useState<Outcome[]>([])
  const [draftOutcomes, setDraftOutcomes] = useState<Outcome[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { product } = await fetchJson(
          `/admin/products/${data.id}?fields=id,categories.id,categories.handle`
        )
        const categories = product?.categories ?? []
        const isMysteryPull = categories.some(
          (c: any) => c.handle === MYSTERY_PULLS_CATEGORY_HANDLE
        )
        if (cancelled) return
        setIsMysteryPullProduct(isMysteryPull)

        if (!isMysteryPull) {
          setLoading(false)
          return
        }

        const poolData = await fetchJson(
          `/admin/mystery-pulls/pool?product_id=${data.id}`
        )
        if (cancelled) return
        setPool(poolData.pool)
        setSavedOutcomes(poolData.outcomes)
        setDraftOutcomes(poolData.outcomes)
      } catch (err: any) {
        if (!cancelled) toast.error("Couldn't load mystery pull data", { description: err.message })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [data.id])

  if (loading || !isMysteryPullProduct) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Mystery Pull</Heading>
      </div>
      <div className="px-6 py-4">
        {pool ? (
          <PoolManager
            pool={pool}
            setPool={setPool}
            savedOutcomes={savedOutcomes}
            setSavedOutcomes={setSavedOutcomes}
            draftOutcomes={draftOutcomes}
            setDraftOutcomes={setDraftOutcomes}
          />
        ) : (
          <SetupForm productId={data.id} onCreated={(p) => setPool(p)} />
        )}
      </div>
    </Container>
  )
}

function SetupForm({
  productId,
  onCreated,
}: {
  productId: string
  onCreated: (pool: Pool) => void
}) {
  const [themeKey, setThemeKey] = useState("")
  const [packArtUrl, setPackArtUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`)
      const json = await res.json()
      setPackArtUrl(json.files?.[0]?.url ?? null)
    } catch (err: any) {
      toast.error("Couldn't upload pack art", { description: err.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate() {
    if (!themeKey.trim()) {
      toast.error("Theme key is required")
      return
    }

    setCreating(true)
    try {
      const { pool } = await fetchJson("/admin/mystery-pulls/pool", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          theme_key: themeKey.trim(),
          pack_art_url: packArtUrl,
        }),
      })
      toast.success("Mystery pull pool created")
      onCreated(pool)
    } catch (err: any) {
      toast.error("Couldn't create pool", { description: err.message })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Text className="text-ui-fg-subtle">
        This product is in the Mystery Pulls category but isn't set up as a
        pull yet. Set a theme and pack art, then add outcomes below.
      </Text>

      <div className="flex flex-col gap-y-2">
        <Label size="small">Theme key</Label>
        <Input
          placeholder="e.g. pokemon-tcg"
          value={themeKey}
          onChange={(e) => setThemeKey(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label size="small">Pack art</Label>
        <div className="flex items-center gap-x-3">
          {packArtUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={packArtUrl}
              alt="Pack art preview"
              className="h-16 w-16 rounded-md border object-cover"
            />
          )}
          <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        </div>
      </div>

      <div>
        <Button onClick={handleCreate} disabled={creating || uploading}>
          {creating ? "Creating…" : "Set up as Mystery Pull"}
        </Button>
      </div>
    </div>
  )
}

function PoolManager({
  pool,
  setPool,
  savedOutcomes,
  setSavedOutcomes,
  draftOutcomes,
  setDraftOutcomes,
}: {
  pool: Pool
  setPool: (p: Pool) => void
  savedOutcomes: Outcome[]
  setSavedOutcomes: (o: Outcome[]) => void
  draftOutcomes: Outcome[]
  setDraftOutcomes: (o: Outcome[]) => void
}) {
  const prompt = usePrompt()
  const [togglingActive, setTogglingActive] = useState(false)

  const liveOdds = useMemo(() => computeLiveOdds(draftOutcomes), [draftOutcomes])
  const totalRemaining = draftOutcomes.reduce(
    (sum, o) => sum + Number(o.remaining_qty || 0),
    0
  )

  async function handleToggleActive() {
    setTogglingActive(true)
    try {
      const { pool: updated } = await fetchJson(`/admin/mystery-pulls/pool/${pool.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !pool.is_active }),
      })
      setPool(updated)
      toast.success(updated.is_active ? "Pool reactivated" : "Pool paused")
    } catch (err: any) {
      toast.error("Couldn't update pool status", { description: err.message })
    } finally {
      setTogglingActive(false)
    }
  }

  function updateDraftField(id: string, field: keyof Outcome, value: string | number) {
    setDraftOutcomes(
      draftOutcomes.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    )
  }

  function isDirty(id: string) {
    const draft = draftOutcomes.find((o) => o.id === id)
    const saved = savedOutcomes.find((o) => o.id === id)
    if (!draft || !saved) return false
    return (
      draft.rarity_tier !== saved.rarity_tier ||
      draft.rarity_color !== saved.rarity_color ||
      Number(draft.weight) !== Number(saved.weight) ||
      Number(draft.remaining_qty) !== Number(saved.remaining_qty)
    )
  }

  async function saveOutcome(id: string) {
    const draft = draftOutcomes.find((o) => o.id === id)
    if (!draft) return

    try {
      const { outcome } = await fetchJson(`/admin/mystery-pulls/outcomes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          rarity_tier: draft.rarity_tier,
          rarity_color: draft.rarity_color,
          weight: Number(draft.weight),
          remaining_qty: Number(draft.remaining_qty),
        }),
      })
      const merged = { ...draft, ...outcome }
      setSavedOutcomes(savedOutcomes.map((o) => (o.id === id ? merged : o)))
      setDraftOutcomes(draftOutcomes.map((o) => (o.id === id ? merged : o)))
      toast.success("Outcome saved")
    } catch (err: any) {
      toast.error("Couldn't save outcome", { description: err.message })
    }
  }

  async function deleteOutcome(id: string, label: string) {
    const confirmed = await prompt({
      title: "Remove this outcome?",
      description: `"${label}" will no longer be a possible prize in this pool. This can't be undone.`,
      variant: "danger",
      confirmText: "Remove",
      cancelText: "Cancel",
    })
    if (!confirmed) return

    try {
      await fetchJson(`/admin/mystery-pulls/outcomes/${id}`, { method: "DELETE" })
      setSavedOutcomes(savedOutcomes.filter((o) => o.id !== id))
      setDraftOutcomes(draftOutcomes.filter((o) => o.id !== id))
      toast.success("Outcome removed")
    } catch (err: any) {
      toast.error("Couldn't remove outcome", { description: err.message })
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          {pool.pack_art_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pool.pack_art_url}
              alt="Pack art"
              className="h-12 w-12 rounded-md border object-cover"
            />
          )}
          <div>
            <Text size="small" weight="plus">
              {pool.theme_key}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {totalRemaining} pulls remaining across {draftOutcomes.length}{" "}
              outcome{draftOutcomes.length === 1 ? "" : "s"}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-x-2">
          <Badge color={pool.is_active ? "green" : "grey"}>
            {pool.is_active ? "Live" : "Paused"}
          </Badge>
          <Switch
            checked={pool.is_active}
            onCheckedChange={handleToggleActive}
            disabled={togglingActive}
          />
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Prize</Table.HeaderCell>
            <Table.HeaderCell>Rarity tier</Table.HeaderCell>
            <Table.HeaderCell>Colour</Table.HeaderCell>
            <Table.HeaderCell>Weight</Table.HeaderCell>
            <Table.HeaderCell>Remaining</Table.HeaderCell>
            <Table.HeaderCell>Odds</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {draftOutcomes.map((o) => (
            <Table.Row key={o.id}>
              <Table.Cell>
                <div className="flex items-center gap-x-2">
                  {o.product_thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.product_thumbnail}
                      alt=""
                      className="h-8 w-8 rounded border object-cover"
                    />
                  )}
                  <div>
                    <Text size="small">{o.product_title ?? "(unknown product)"}</Text>
                    {o.variant_title && (
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {o.variant_title}
                      </Text>
                    )}
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <Input
                  size="small"
                  value={o.rarity_tier}
                  onChange={(e) => updateDraftField(o.id, "rarity_tier", e.target.value)}
                />
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-x-2">
                  <div
                    className="h-5 w-5 shrink-0 rounded border"
                    style={{ background: o.rarity_color }}
                  />
                  <Input
                    size="small"
                    value={o.rarity_color}
                    onChange={(e) => updateDraftField(o.id, "rarity_color", e.target.value)}
                    className="w-24"
                  />
                </div>
              </Table.Cell>
              <Table.Cell>
                <Input
                  size="small"
                  type="number"
                  min={0}
                  value={o.weight}
                  onChange={(e) => updateDraftField(o.id, "weight", e.target.value)}
                  className="w-20"
                />
              </Table.Cell>
              <Table.Cell>
                <Input
                  size="small"
                  type="number"
                  min={0}
                  value={o.remaining_qty}
                  onChange={(e) => updateDraftField(o.id, "remaining_qty", e.target.value)}
                  className="w-20"
                />
              </Table.Cell>
              <Table.Cell>
                <Text size="small">{liveOdds[o.id]?.toFixed(1) ?? "0.0"}%</Text>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-x-2">
                  {isDirty(o.id) && (
                    <Button size="small" variant="secondary" onClick={() => saveOutcome(o.id)}>
                      Save
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() =>
                      deleteOutcome(o.id, o.product_title ?? o.rarity_tier)
                    }
                  >
                    Remove
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <AddOutcomeForm
        poolId={pool.id}
        onAdded={(outcome) => {
          setSavedOutcomes([...savedOutcomes, outcome])
          setDraftOutcomes([...draftOutcomes, outcome])
        }}
      />
    </div>
  )
}

function AddOutcomeForm({
  poolId,
  onAdded,
}: {
  poolId: string
  onAdded: (outcome: Outcome) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null)
  const [variantId, setVariantId] = useState("")
  const [rarityTier, setRarityTier] = useState("")
  const [rarityColor, setRarityColor] = useState("#3b6eff")
  const [weight, setWeight] = useState("10")
  const [remainingQty, setRemainingQty] = useState("1")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    const handle = setTimeout(async () => {
      try {
        const { products } = await fetchJson(
          `/admin/products?q=${encodeURIComponent(query)}&limit=8&fields=id,title,thumbnail,variants.id,variants.title`
        )
        if (!cancelled) setResults(products ?? [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query])

  function selectProduct(product: ProductSearchResult) {
    setSelectedProduct(product)
    setVariantId(product.variants[0]?.id ?? "")
    setQuery("")
    setResults([])
  }

  const canAdd =
    selectedProduct && variantId && rarityTier.trim() && rarityColor.trim() &&
    weight !== "" && remainingQty !== ""

  async function handleAdd() {
    if (!selectedProduct || !canAdd) return

    setAdding(true)
    try {
      const { outcome } = await fetchJson(`/admin/mystery-pulls/pool/${poolId}/outcomes`, {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct.id,
          variant_id: variantId,
          rarity_tier: rarityTier.trim(),
          rarity_color: rarityColor.trim(),
          weight: Number(weight),
          remaining_qty: Number(remainingQty),
        }),
      })
      const variant = selectedProduct.variants.find((v) => v.id === variantId)
      onAdded({
        id: outcome.id,
        rarity_tier: outcome.rarity_tier,
        rarity_color: outcome.rarity_color,
        weight: outcome.weight,
        remaining_qty: outcome.remaining_qty,
        product_id: selectedProduct.id,
        variant_id: variantId,
        product_title: selectedProduct.title,
        product_thumbnail: selectedProduct.thumbnail,
        variant_title: variant?.title ?? null,
      })
      toast.success("Outcome added")
      setSelectedProduct(null)
      setVariantId("")
      setRarityTier("")
      setRarityColor("#3b6eff")
      setWeight("10")
      setRemainingQty("1")
    } catch (err: any) {
      toast.error("Couldn't add outcome", { description: err.message })
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <Text size="small" weight="plus" className="mb-3">
        Add an outcome
      </Text>

      {!selectedProduct ? (
        <div className="flex flex-col gap-y-2">
          <Label size="small">Search for the prize product</Label>
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching && <Text size="xsmall" className="text-ui-fg-subtle">Searching…</Text>}
          {results.length > 0 && (
            <div className="flex flex-col divide-y rounded-md border">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className="flex items-center gap-x-2 px-3 py-2 text-left hover:bg-ui-bg-subtle-hover"
                >
                  {p.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt="" className="h-6 w-6 rounded object-cover" />
                  )}
                  <Text size="small">{p.title}</Text>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              {selectedProduct.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.thumbnail}
                  alt=""
                  className="h-8 w-8 rounded border object-cover"
                />
              )}
              <Text size="small">{selectedProduct.title}</Text>
            </div>
            <Button size="small" variant="transparent" onClick={() => setSelectedProduct(null)}>
              Change
            </Button>
          </div>

          {selectedProduct.variants.length > 1 && (
            <div className="flex flex-col gap-y-2">
              <Label size="small">Variant</Label>
              <Select value={variantId} onValueChange={setVariantId}>
                <Select.Trigger>
                  <Select.Value placeholder="Choose a variant" />
                </Select.Trigger>
                <Select.Content>
                  {selectedProduct.variants.map((v) => (
                    <Select.Item key={v.id} value={v.id}>
                      {v.title}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-y-2">
              <Label size="small">Rarity tier</Label>
              <Input
                placeholder="e.g. Rare"
                value={rarityTier}
                onChange={(e) => setRarityTier(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label size="small">Colour</Label>
              <div className="flex items-center gap-x-2">
                <div
                  className="h-6 w-6 shrink-0 rounded border"
                  style={{ background: rarityColor }}
                />
                <Input value={rarityColor} onChange={(e) => setRarityColor(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label size="small">Weight</Label>
              <Input
                type="number"
                min={0}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label size="small">Remaining qty</Label>
              <Input
                type="number"
                min={0}
                value={remainingQty}
                onChange={(e) => setRemainingQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button onClick={handleAdd} disabled={!canAdd || adding}>
              {adding ? "Adding…" : "Add outcome"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default PullPoolWidget
