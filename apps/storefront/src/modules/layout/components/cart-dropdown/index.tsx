"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Minus, Plus, Spinner, Trash } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.item_subtotal ?? cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="font-mono text-mono-sku uppercase tracking-[0.08em] text-chrome hover:text-cobalt-soft"
            href="/cart"
            data-testid="nav-cart-link"
          >{`Bag (${totalItems})`}</LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 w-[400px] rounded-large border border-line bg-ink-2 shadow-2xl"
            data-testid="nav-cart-dropdown"
          >
            <div className="border-b border-dashed border-line px-5 py-4">
              <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-chrome-dim">
                MOWY &middot; Your bag
              </span>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="max-h-[420px] overflow-y-scroll px-5 no-scrollbar">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <DropdownLineItem
                        key={item.id}
                        item={item}
                        currencyCode={cartState.currency_code}
                      />
                    ))}
                </div>
                <div className="flex flex-col gap-y-4 border-t border-dashed border-line px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm font-medium uppercase tracking-[0.08em] text-chrome">
                      Subtotal
                    </span>
                    <span
                      className="font-mono text-mono-price text-cobalt-soft"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <button
                      onClick={close}
                      className="w-full rounded-base bg-cobalt-deep py-3 text-body-sm font-medium uppercase tracking-[0.08em] text-chrome transition-colors hover:bg-cobalt-deep/90"
                      data-testid="go-to-cart-button"
                    >
                      Go to bag
                    </button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-y-4 py-16">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-line font-mono text-mono-sku text-chrome-dim">
                  0
                </div>
                <span className="text-body-sm text-chrome-dim">
                  Your bag is empty.
                </span>
                <LocalizedClientLink href="/store">
                  <button
                    onClick={close}
                    className="font-mono text-mono-sku uppercase tracking-[0.08em] text-cobalt-soft hover:text-chrome"
                  >
                    Explore products
                  </button>
                </LocalizedClientLink>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

const DropdownLineItem = ({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) => {
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)

  const maxQuantity = Math.min(item.variant?.inventory_quantity ?? 10, 10)

  const changeQuantity = async (quantity: number) => {
    if (quantity < 1 || quantity > maxQuantity) {
      return
    }

    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity }).finally(() =>
      setUpdating(false)
    )
  }

  const handleRemove = async () => {
    setRemoving(true)
    await deleteLineItem(item.id).catch(() => setRemoving(false))
  }

  return (
    <div
      className="grid grid-cols-[56px_1fr] gap-x-3 border-b border-dashed border-line py-4 last:border-b-0"
      data-testid="cart-item"
    >
      <LocalizedClientLink href={`/products/${item.product_handle}`} className="w-14">
        <Thumbnail thumbnail={item.thumbnail} size="square" />
      </LocalizedClientLink>
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="line-clamp-2 text-body-sm text-chrome hover:text-cobalt-soft"
            data-testid="product-link"
          >
            {item.title}
          </LocalizedClientLink>
          <span
            className="shrink-0 font-mono text-mono-sku text-chrome"
            data-testid="cart-item-quantity"
          >
            {convertToLocale({ amount: item.total ?? 0, currency_code: currencyCode })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-base border border-line">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center text-chrome-dim hover:text-cobalt-soft disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => changeQuantity(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus />
            </button>
            <span className="w-6 text-center font-mono text-mono-sku text-chrome">
              {updating ? <Spinner className="mx-auto animate-spin" /> : item.quantity}
            </span>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center text-chrome-dim hover:text-cobalt-soft disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => changeQuantity(item.quantity + 1)}
              disabled={updating || item.quantity >= maxQuantity}
              aria-label="Increase quantity"
            >
              <Plus />
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 font-mono text-mono-sku uppercase tracking-[0.06em] text-chrome-dim hover:text-rose-400"
            onClick={handleRemove}
            disabled={removing}
            data-testid="cart-item-remove-button"
          >
            {removing ? <Spinner className="animate-spin" /> : <Trash />}
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartDropdown
