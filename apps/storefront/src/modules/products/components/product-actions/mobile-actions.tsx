import { Dialog, Transition } from "@headlessui/react"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import ChevronDown from "@modules/common/icons/chevron-down"
import X from "@modules/common/icons/x"

import { getProductPrice } from "@lib/util/get-product-price"
import { isSimpleProduct } from "@lib/util/product"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@/components/ui/button"
import OptionSelect from "./option-select"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)

  return (
    <>
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 ${
          !show ? "pointer-events-none" : ""
        }`}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-y-3 border-t border-line bg-ink-2 p-4 text-base"
            data-testid="mobile-actions"
          >
            <div className="flex items-center gap-x-2 text-chrome">
              <span data-testid="mobile-title">{product.title}</span>
              <span className="text-chrome-dim">—</span>
              {selectedPrice ? (
                <div className="flex items-end gap-x-2">
                  {selectedPrice.price_type === "sale" && (
                    <span className="text-sm text-chrome-dim line-through">
                      {selectedPrice.original_price}
                    </span>
                  )}
                  <span className="font-mono text-cobalt-soft">
                    {selectedPrice.calculated_price}
                  </span>
                </div>
              ) : (
                <div />
              )}
            </div>
            <div
              className={`grid w-full gap-x-4 ${
                isSimple ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="outline"
                  className="w-full border-line text-chrome"
                  data-testid="mobile-actions-button"
                >
                  <div className="flex w-full items-center justify-between">
                    <span>
                      {variant
                        ? Object.values(options).join(" / ")
                        : "Select Options"}
                    </span>
                    <ChevronDown />
                  </div>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant}
                className="w-full bg-cobalt-deep text-chrome hover:bg-cobalt-deep/90"
                data-testid="mobile-cart-button"
              >
                {isAdding
                  ? "Adding…"
                  : !variant
                  ? "Select variant"
                  : !inStock
                  ? "Out of stock"
                  : "Add to cart"}
              </Button>
            </div>
          </div>
        </Transition>
      </div>
      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0">
            <div className="flex h-full min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Panel
                  className="flex h-full w-full transform flex-col gap-y-3 overflow-hidden text-left"
                  data-testid="mobile-actions-modal"
                >
                  <div className="flex w-full justify-end pr-6">
                    <button
                      onClick={close}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-2 text-chrome"
                      data-testid="close-modal-button"
                    >
                      <X />
                    </button>
                  </div>
                  <div className="bg-ink-2 px-6 py-12">
                    {(product.variants?.length ?? 0) > 1 && (
                      <div className="flex flex-col gap-y-6">
                        {(product.options || []).map((option) => (
                          <OptionSelect
                            key={option.id}
                            option={option}
                            current={options[option.id]}
                            updateOption={updateOptions}
                            title={option.title ?? ""}
                            disabled={optionsDisabled}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
