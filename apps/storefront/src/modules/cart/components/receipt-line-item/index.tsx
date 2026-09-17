"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Minus, Plus, Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

const MAX_QUANTITY = 10

type ReceiptLineItemProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}

const ReceiptLineItem = ({ item, currencyCode }: ReceiptLineItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxQuantity = Math.min(
    item.variant?.inventory_quantity ?? MAX_QUANTITY,
    MAX_QUANTITY
  )

  const changeQuantity = async (quantity: number) => {
    if (quantity < 1 || quantity > maxQuantity) {
      return
    }

    setError(null)
    setUpdating(true)

    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const handleRemove = async () => {
    setError(null)
    setRemoving(true)

    await deleteLineItem(item.id).catch((err) => {
      setError(err.message)
      setRemoving(false)
    })
  }

  const variantTitle =
    item.variant?.title && item.variant.title !== "Default Variant"
      ? item.variant.title
      : null

  return (
    <div
      className="flex gap-4 border-b border-dashed border-line py-4 last:border-b-0"
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="w-16 shrink-0"
      >
        <Thumbnail thumbnail={item.thumbnail} size="square" />
      </LocalizedClientLink>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <LocalizedClientLink
              href={`/products/${item.product_handle}`}
              className="line-clamp-2 text-body-sm font-medium text-chrome hover:text-cobalt-soft"
              data-testid="product-title"
            >
              {item.product_title}
            </LocalizedClientLink>
            {variantTitle && (
              <p className="font-mono text-mono-sku text-chrome-dim">
                {variantTitle}
              </p>
            )}
          </div>

          <span
            className="shrink-0 font-mono text-mono-price text-chrome"
            data-testid="product-total"
          >
            {convertToLocale({
              amount: item.total ?? 0,
              currency_code: currencyCode,
            })}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-base border border-line">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center text-chrome-dim transition-colors hover:text-cobalt-soft disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => changeQuantity(item.quantity - 1)}
                disabled={updating || item.quantity <= 1}
                aria-label="Decrease quantity"
                data-testid="product-decrease-button"
              >
                <Minus />
              </button>
              <span
                className="w-7 text-center font-mono text-mono-sku text-chrome"
                data-testid="product-quantity"
              >
                {updating ? <Spinner className="mx-auto animate-spin" /> : item.quantity}
              </span>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center text-chrome-dim transition-colors hover:text-cobalt-soft disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => changeQuantity(item.quantity + 1)}
                disabled={updating || item.quantity >= maxQuantity}
                aria-label="Increase quantity"
                data-testid="product-increase-button"
              >
                <Plus />
              </button>
            </div>

            <span className="font-mono text-mono-sku text-chrome-dim">
              {convertToLocale({
                amount: (item.total ?? 0) / item.quantity,
                currency_code: currencyCode,
              })}{" "}
              ea
            </span>
          </div>

          <button
            type="button"
            className={clx(
              "flex items-center gap-1 font-mono text-mono-sku uppercase tracking-[0.06em] text-chrome-dim transition-colors hover:text-rose-400",
              { "opacity-50": removing }
            )}
            onClick={handleRemove}
            disabled={removing}
            data-testid="product-delete-button"
          >
            {removing ? <Spinner className="animate-spin" /> : <Trash />}
            Remove
          </button>
        </div>

        {error && (
          <p className="text-body-sm text-rose-400" data-testid="product-error-message">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default ReceiptLineItem
