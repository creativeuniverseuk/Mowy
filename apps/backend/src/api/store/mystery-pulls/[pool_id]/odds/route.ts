import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";

type PullOutcomeRow = {
  id: string;
  rarity_tier: string;
  rarity_color: string;
  weight: number;
  remaining_qty: number;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { pool_id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: pools } = await query.graph({
    entity: "pull_pool",
    fields: ["id", "is_active"],
    filters: { id: pool_id } as any,
  });
  const pool = pools[0];

  if (!pool) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Mystery pull pool "${pool_id}" was not found.`
    );
  }

  const { data: outcomes } = await query.graph({
    entity: "pull_outcome",
    fields: ["id", "rarity_tier", "rarity_color", "weight", "remaining_qty"],
    filters: { pool_id } as any,
  });

  const rows = outcomes as unknown as PullOutcomeRow[];

  const totalWeight = rows
    .filter((outcome) => Number(outcome.remaining_qty) > 0)
    .reduce((sum, outcome) => sum + Number(outcome.weight), 0);

  const totalRemainingQty = rows.reduce(
    (sum, outcome) => sum + Number(outcome.remaining_qty),
    0
  );

  res.json({
    pool_id: pool.id,
    is_active: pool.is_active,
    total_remaining_qty: totalRemainingQty,
    outcomes: rows.map((outcome) => ({
      id: outcome.id,
      rarity_tier: outcome.rarity_tier,
      rarity_color: outcome.rarity_color,
      remaining_qty: Number(outcome.remaining_qty),
      // Sold-out tiers (remaining_qty 0) have no live chance of being drawn,
      // regardless of their configured weight — matches the eligibility
      // filter assignOutcomeStep itself uses when picking a winner.
      percentage:
        Number(outcome.remaining_qty) > 0 && totalWeight > 0
          ? Math.round((Number(outcome.weight) / totalWeight) * 10000) / 100
          : 0,
    })),
  });
}
