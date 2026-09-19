import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/types"
import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"

// Mirrors the card_detail module's model (apps/backend/src/modules/card_detail)
// — duplicated rather than imported for the same reason as pull-pool.tsx: this
// file is bundled by the admin dashboard's own Vite build.
type CardDetail = {
  id: string
  card_set: string
  rarity: string
  condition: string
  is_graded: boolean
  grading_company: string | null
  grade: number | null
}

type FormState = {
  card_set: string
  rarity: string
  condition: string
  is_graded: boolean
  grading_company: string
  grade: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

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
  return res.json()
}

function toForm(cardDetail: CardDetail | null): FormState {
  return {
    card_set: cardDetail?.card_set ?? "",
    rarity: cardDetail?.rarity ?? "",
    condition: cardDetail?.condition ?? "",
    is_graded: cardDetail?.is_graded ?? false,
    grading_company: cardDetail?.grading_company ?? "",
    grade: cardDetail?.grade != null ? String(cardDetail.grade) : "",
  }
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.card_set.trim()) errors.card_set = "Card set is required"
  if (!form.rarity.trim()) errors.rarity = "Rarity is required"
  if (!form.condition.trim()) errors.condition = "Condition is required"

  if (form.is_graded && form.grade.trim()) {
    const grade = Number(form.grade)
    // Same rule as the API's validators.ts: one decimal place at most, with a
    // tolerance for float noise (1.1 * 10 === 11.000000000000002).
    if (!Number.isFinite(grade) || grade <= 0) {
      errors.grade = "Grade must be greater than 0"
    } else if (Math.abs(grade * 10 - Math.round(grade * 10)) >= 1e-6) {
      errors.grade = "Grade can have at most one decimal place (e.g. 9.5)"
    }
  }

  return errors
}

const CardDetailWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [cardDetail, setCardDetail] = useState<CardDetail | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadFailed(false)
      try {
        // "+" has to be encoded — a raw one decodes to a space in a query
        // string and the field would be dropped.
        const { product } = await fetchJson(
          `/admin/products/${data.id}?fields=${encodeURIComponent("+card_detail.*")}`
        )
        if (!cancelled) setCardDetail(product?.card_detail ?? null)
      } catch (err: any) {
        if (!cancelled) {
          setLoadFailed(true)
          toast.error("Couldn't load card details", { description: err.message })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [data.id])

  if (loading) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">Card details</Heading>
          {cardDetail && (
            <Badge size="2xsmall" color={cardDetail.is_graded ? "blue" : "grey"}>
              {cardDetail.is_graded ? "Graded" : "Ungraded"}
            </Badge>
          )}
        </div>
        {/* Hidden on a failed load: "Add" would look like there's nothing
            saved yet, and saving would overwrite whatever is. */}
        {!loadFailed && (
          <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
            {cardDetail ? "Edit" : "Add"}
          </Button>
        )}
      </div>

      {loadFailed ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-error">
            Card details couldn't be loaded. Refresh the page to try again.
          </Text>
        </div>
      ) : cardDetail ? (
        <>
          <Row label="Card set" value={cardDetail.card_set} />
          <Row label="Rarity" value={cardDetail.rarity} />
          <Row label="Condition" value={cardDetail.condition} />
          <Row
            label="Grading company"
            value={cardDetail.is_graded ? cardDetail.grading_company : null}
          />
          <Row
            label="Grade"
            value={cardDetail.is_graded ? cardDetail.grade : null}
          />
        </>
      ) : (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            No card details yet. Add a set, rarity and condition for this
            product.
          </Text>
        </div>
      )}

      <CardDetailDrawer
        open={open}
        onOpenChange={setOpen}
        productId={data.id}
        cardDetail={cardDetail}
        onSaved={setCardDetail}
      />
    </Container>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: string | number | null
}) {
  return (
    <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
      <Text size="small" weight="plus" leading="compact">
        {label}
      </Text>
      <Text size="small" leading="compact" className="text-ui-fg-base">
        {value ?? "-"}
      </Text>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus" htmlFor={id}>
        {label}
      </Label>
      {children}
      {error && (
        <Text size="small" className="text-ui-fg-error">
          {error}
        </Text>
      )}
    </div>
  )
}

function CardDetailDrawer({
  open,
  onOpenChange,
  productId,
  cardDetail,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  cardDetail: CardDetail | null
  onSaved: (cardDetail: CardDetail) => void
}) {
  const [form, setForm] = useState<FormState>(() => toForm(cardDetail))
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  // Start from the saved values each time the drawer opens, so a cancelled
  // edit doesn't leak into the next one.
  useEffect(() => {
    if (open) {
      setForm(toForm(cardDetail))
      setErrors({})
    }
  }, [open])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    const gradingCompany = form.grading_company.trim()
    const grade = form.grade.trim()

    setSaving(true)
    try {
      const { card_detail } = await fetchJson(
        `/admin/products/${productId}/card-detail`,
        {
          method: "POST",
          body: JSON.stringify({
            card_set: form.card_set.trim(),
            rarity: form.rarity.trim(),
            condition: form.condition.trim(),
            is_graded: form.is_graded,
            grading_company: form.is_graded && gradingCompany ? gradingCompany : null,
            grade: form.is_graded && grade ? Number(grade) : null,
          }),
        }
      )
      toast.success("Card details saved")
      onSaved(card_detail)
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Couldn't save card details", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <Drawer.Header>
            <Drawer.Title>{cardDetail ? "Edit card details" : "Add card details"}</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
            <Field id="card_set" label="Card set" error={errors.card_set}>
              <Input
                id="card_set"
                value={form.card_set}
                onChange={(e) => update("card_set", e.target.value)}
                aria-invalid={!!errors.card_set}
              />
            </Field>

            <Field id="rarity" label="Rarity" error={errors.rarity}>
              <Input
                id="rarity"
                value={form.rarity}
                onChange={(e) => update("rarity", e.target.value)}
                aria-invalid={!!errors.rarity}
              />
            </Field>

            <Field id="condition" label="Condition" error={errors.condition}>
              <Input
                id="condition"
                value={form.condition}
                onChange={(e) => update("condition", e.target.value)}
                aria-invalid={!!errors.condition}
              />
            </Field>

            <div className="flex items-center justify-between">
              <Label size="small" weight="plus" htmlFor="is_graded">
                Graded
              </Label>
              <Switch
                id="is_graded"
                checked={form.is_graded}
                onCheckedChange={(checked) => update("is_graded", checked)}
              />
            </div>

            <Field id="grading_company" label="Grading company" error={errors.grading_company}>
              <Input
                id="grading_company"
                placeholder="e.g. PSA"
                value={form.grading_company}
                onChange={(e) => update("grading_company", e.target.value)}
                disabled={!form.is_graded}
              />
            </Field>

            <Field id="grade" label="Grade" error={errors.grade}>
              <Input
                id="grade"
                type="number"
                min={0.1}
                step={0.1}
                placeholder="e.g. 9.5"
                value={form.grade}
                onChange={(e) => update("grade", e.target.value)}
                disabled={!form.is_graded}
                aria-invalid={!!errors.grade}
              />
            </Field>
          </Drawer.Body>

          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button type="button" size="small" variant="secondary">
                Cancel
              </Button>
            </Drawer.Close>
            <Button type="submit" size="small" isLoading={saving}>
              Save
            </Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default CardDetailWidget
