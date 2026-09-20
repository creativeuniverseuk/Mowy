import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type PoolRow = {
  id: string;
  product: { id: string; title: string } | null;
};

type OutcomeRow = {
  id: string;
  pool_id: string;
  rarity_tier: string;
  remaining_qty: number;
  product_variant: {
    sku: string | null;
    product: { title: string } | null;
  } | null;
};

// Also read by the dashboard page (src/admin/routes/dashboard/page.tsx), which
// keeps its own copy of this shape — the admin bundle can't import from here.
type StockItem = {
  key: string;
  product_id: string;
  product_title: string;
  rarity_tier: string | null;
  prize_title: string | null;
  prize_sku: string | null;
  remaining_qty: number;
};

/**
 * Backs the admin dashboard's low-stock panel (src/admin/routes/dashboard).
 * Mystery Pull stock isn't Medusa inventory — each outcome's copies are
 * counted in `pull_outcome.remaining_qty` — so the panel can't see it through
 * the core inventory API. This returns one item per outcome of every active
 * pool, in the same shape the panel already renders for regular variants;
 * the thresholds and status pills are applied on the client, identically for
 * both.
 *
 * Pools whose product no longer exists are skipped: deleting a product
 * doesn't delete its pool (see CLAUDE.md's Mystery Pull module note), and a
 * pool nobody can reach or buy from isn't stock anyone is running.
 *
 * An active pool with no outcomes at all can't sell anything, so it comes
 * back as a single item with a null tier and 0 remaining — otherwise it
 * would be the one broken state with nothing to show.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: pools } = await query.graph({
    entity: "pull_pool",
    fields: ["id", "product.id", "product.title"],
    filters: { is_active: true } as any,
    pagination: { take: 1000 },
  });

  const livePools = (pools as unknown as PoolRow[]).filter((p) => p.product);

  if (!livePools.length) {
    return res.json({ items: [] });
  }

  const { data: outcomes } = await query.graph({
    entity: "pull_outcome",
    fields: [
      "id",
      "pool_id",
      "rarity_tier",
      "remaining_qty",
      "product_variant.sku",
      "product_variant.product.title",
    ],
    filters: { pool_id: livePools.map((p) => p.id) } as any,
    pagination: { take: 5000 },
  });

  const outcomesByPool = new Map<string, OutcomeRow[]>();
  for (const outcome of outcomes as unknown as OutcomeRow[]) {
    const list = outcomesByPool.get(outcome.pool_id) ?? [];
    list.push(outcome);
    outcomesByPool.set(outcome.pool_id, list);
  }

  const items = livePools.flatMap<StockItem>((pool) => {
    const product = pool.product!;
    const poolOutcomes = outcomesByPool.get(pool.id) ?? [];

    if (!poolOutcomes.length) {
      return [
        {
          key: `pool:${pool.id}`,
          product_id: product.id,
          product_title: product.title,
          rarity_tier: null,
          prize_title: null,
          prize_sku: null,
          remaining_qty: 0,
        },
      ];
    }

    return poolOutcomes.map((outcome) => ({
      key: outcome.id,
      product_id: product.id,
      product_title: product.title,
      rarity_tier: outcome.rarity_tier,
      prize_title: outcome.product_variant?.product?.title ?? null,
      prize_sku: outcome.product_variant?.sku ?? null,
      remaining_qty: Number(outcome.remaining_qty),
    }));
  });

  res.json({ items });
}
