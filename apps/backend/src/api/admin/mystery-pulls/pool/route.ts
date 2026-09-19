import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { MYSTERY_PULL_MODULE } from "../../../../modules/mystery_pull";
import MysteryPullModuleService from "../../../../modules/mystery_pull/service";

/**
 * Backs the pull-pool admin widget (src/admin/widgets/pull-pool.tsx). One
 * pool per product (see src/links/product-pull-pool.ts, a 1:1 link) — this
 * route is keyed by `product_id` rather than pool id because the widget
 * only ever knows the product it's rendered on.
 *
 * Returns `{ pool: null, outcomes: [] }` (not a 404) when the product has
 * no pool yet — that's the normal "not set up as a mystery pull" state the
 * widget renders its setup form for, not an error.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.query.product_id as string | undefined;
  if (!productId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "product_id query parameter is required."
    );
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "pull_pool.id",
      "pull_pool.theme_key",
      "pull_pool.pack_art_url",
      "pull_pool.is_active",
    ],
    filters: { id: productId } as any,
  });
  const pool = (products[0] as any)?.pull_pool ?? null;

  if (!pool) {
    return res.json({ pool: null, outcomes: [] });
  }

  const { data: outcomes } = await query.graph({
    entity: "pull_outcome",
    fields: [
      "id",
      "rarity_tier",
      "rarity_color",
      "weight",
      "remaining_qty",
      "linked_product_id",
      "linked_variant_id",
      "product_variant.id",
      "product_variant.title",
      "product_variant.product.id",
      "product_variant.product.title",
      "product_variant.product.thumbnail",
    ],
    filters: { pool_id: pool.id } as any,
  });

  res.json({
    pool,
    outcomes: (outcomes as any[]).map((o) => ({
      id: o.id,
      rarity_tier: o.rarity_tier,
      rarity_color: o.rarity_color,
      weight: o.weight,
      remaining_qty: o.remaining_qty,
      product_id: o.product_variant?.product?.id ?? o.linked_product_id,
      variant_id: o.product_variant?.id ?? o.linked_variant_id,
      product_title: o.product_variant?.product?.title ?? null,
      product_thumbnail: o.product_variant?.product?.thumbnail ?? null,
      variant_title: o.product_variant?.title ?? null,
    })),
  });
}

/**
 * Creates a pool and links it to a product in one call — the widget's
 * "Set up as Mystery Pull" form has nowhere else to trigger the link
 * separately, and a pool with no product link isn't reachable by any
 * customer-facing route anyway (see lib/data/mystery-pulls.ts on the
 * storefront side, which discovers pools entirely through the product
 * link).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as {
    product_id?: string;
    theme_key?: string;
    pack_art_url?: string | null;
  };

  if (!body.product_id || !body.theme_key) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "product_id and theme_key are required."
    );
  }

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const mysteryPullModuleService: MysteryPullModuleService = req.scope.resolve(
    MYSTERY_PULL_MODULE
  );

  const pool = await mysteryPullModuleService.createPullPools({
    theme_key: body.theme_key,
    pack_art_url: body.pack_art_url ?? null,
    is_active: true,
  });

  try {
    await link.create({
      [Modules.PRODUCT]: { product_id: body.product_id },
      [MYSTERY_PULL_MODULE]: { pull_pool_id: pool.id },
    });
  } catch (error: any) {
    // See CLAUDE.md's Mystery Pull module note: a product that was linked
    // to a pool before and had that pool deleted without the link being
    // dismissed will hit this. Roll back the pool we just created rather
    // than leaving an orphan, and surface a clear, actionable message
    // instead of a raw constraint error.
    await mysteryPullModuleService.deletePullPools([pool.id]);
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Could not link this product to a new pool — it may already have one, including a soft-deleted link from a previous pool that wasn't cleanly removed. Original error: ${error.message}`
    );
  }

  res.json({ pool });
}
