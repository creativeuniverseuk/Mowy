import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export type LineItemMetadata = {
  won_product_id: string;
  won_variant_id: string | null;
  rarity_tier: string;
  rarity_color: string;
} | null;

/**
 * Reads order_line_item.metadata directly via SQL rather than through
 * query.graph's order aggregate.
 *
 * This exists because query.graph's resolution of `items.metadata` (and
 * `items.line_item_metadata`, the differently-named field the order
 * aggregate DTO also exposes — see its doc comment in @medusajs/types:
 * `metadata` there is documented as "the *versioned* order item metadata",
 * a different, always-empty-for-us field; `line_item_metadata` is
 * documented as the real one) was confirmed unreliable by direct,
 * side-by-side testing against live orders in this environment: the same
 * order, queried twice in the same process moments apart, sometimes
 * returned genuinely-set metadata and sometimes returned empty — for
 * *either* field name, independent of how long ago the write happened.
 * Raw SQL against order_line_item was correct in every single one of
 * those tests, including immediately after a write. Whatever the exact
 * cause (this project's Postgres is a pooled Neon connection, and
 * query.graph goes through a separate MikroORM-managed connection/cache
 * than the driver's own PG_CONNECTION), the fix is to not depend on
 * query.graph for this one specific, correctness-critical read.
 *
 * Used everywhere this codebase needs to know "has this mystery-pull line
 * item already been assigned an outcome" — the result API route, the
 * payment.captured subscriber, and the reconciliation sweep job — so all
 * three agree and none of them can redraw (and redecrement real inventory
 * for) a line item that already has a result.
 */
export async function fetchLineItemMetadata(
  container: MedusaContainer,
  lineItemId: string
): Promise<LineItemMetadata> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const { rows } = await knex.raw(
    `select metadata from order_line_item where id = ? and deleted_at is null`,
    [lineItemId]
  );
  const metadata = rows[0]?.metadata ?? null;
  return metadata?.won_product_id ? (metadata as LineItemMetadata) : null;
}

/**
 * Batched version of the "already assigned" check — given candidate line
 * item ids, returns the subset that already carry a won_product_id.
 */
export async function fetchAlreadyAssignedLineItemIds(
  container: MedusaContainer,
  lineItemIds: string[]
): Promise<Set<string>> {
  if (!lineItemIds.length) {
    return new Set();
  }

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const { rows } = await knex.raw(
    `select id, metadata from order_line_item where id = ANY(?) and deleted_at is null`,
    [lineItemIds]
  );

  const assigned = new Set<string>();
  for (const row of rows as { id: string; metadata: Record<string, unknown> | null }[]) {
    if (row.metadata?.won_product_id) {
      assigned.add(row.id);
    }
  }
  return assigned;
}
