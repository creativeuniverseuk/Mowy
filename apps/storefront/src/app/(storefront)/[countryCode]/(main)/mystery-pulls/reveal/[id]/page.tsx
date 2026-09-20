import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveOrder } from "@lib/data/orders"
import { getMysteryPullOdds, getProductPullPool } from "@lib/data/mystery-pulls"
import PullRevealOverlay from "@modules/mystery-pulls/components/pull-reveal-overlay"

export const metadata: Metadata = {
  title: "Opening your pull | MOWY",
}

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

/**
 * Reached only via the SumUp checkout return route once it confirms the
 * completed order is a mystery pull (see app/checkout/sumup/return). The
 * pack theme colour is derived the same way as the product page's hero —
 * the rarest currently-pullable outcome's rarity_color — since pull_pool
 * itself has no colour field (see lib/data/mystery-pulls.ts).
 */
export default async function MysteryPullRevealPage(props: Props) {
  const { id } = await props.params
  const order = await retrieveOrder(id).catch(() => null)

  if (!order) {
    notFound()
  }

  const pullItem = order.items?.[0]
  const productId = pullItem?.product?.id ?? null
  const productHandle = pullItem?.product?.handle ?? null

  const pool = productId ? await getProductPullPool(productId) : null
  const odds = pool ? await getMysteryPullOdds(pool.poolId) : null

  const eligible = (odds?.outcomes ?? []).filter((o) => o.remaining_qty > 0)
  const rarest = eligible.length
    ? eligible.reduce((min, o) => (o.percentage < min.percentage ? o : min))
    : null

  return (
    <PullRevealOverlay
      orderId={order.id}
      packArtUrl={pool?.packArtUrl ?? null}
      packThemeColor={rarest?.rarity_color ?? "#3b6eff"}
      productHandle={productHandle}
    />
  )
}
