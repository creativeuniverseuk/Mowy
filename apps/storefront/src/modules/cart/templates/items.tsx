import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"

import ReceiptLineItem from "@modules/cart/components/receipt-line-item"
import ReceiptLineItemSkeleton from "@modules/cart/components/receipt-line-item/skeleton"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items

  return (
    <div>
      {items
        ? items
            .sort((a, b) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
            })
            .map((item) => (
              <ReceiptLineItem
                key={item.id}
                item={item}
                currencyCode={cart?.currency_code ?? "gbp"}
              />
            ))
        : repeat(5).map((i) => <ReceiptLineItemSkeleton key={i} />)}
    </div>
  )
}

export default ItemsTemplate
