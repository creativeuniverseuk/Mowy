import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MYSTERY_PULL_MODULE } from "../modules/mystery_pull";
import MysteryPullModuleService from "../modules/mystery_pull/service";

const MYSTERY_PULLS_CATEGORY_HANDLE = "mystery-pulls";
const THEME_KEY = "demo-pokemon-mystery-pull";

// The pack itself — the product a customer actually buys and checks out
// with. Must be a product whose variant has a working stock location (see
// CLAUDE.md/this pool's own outcome comments below); "SumUp Sandbox
// Checkout Test" is the one product in this dev catalog confirmed to
// complete a real cart -> checkout -> SumUp flow, which is the whole point
// of this fixture existing.
const PACK_PRODUCT_HANDLE = "sumup-sandbox-checkout-test";

// Prize products — what a customer can actually win. Only two other real
// products exist in this dev catalog (each with exactly one variant), so
// this pool has two outcomes rather than three; a third would require
// fabricating a new catalog product, which this script deliberately does
// not do.
const OUTCOME_PRODUCT_HANDLES = [
  {
    handle: "test-charizard-ex-card-fields",
    rarity_tier: "Rare",
    rarity_color: "#3b82f6",
    weight: 30,
    remaining_qty: 5,
  },
  {
    handle: "sumup-sandbox-failure-test-11-total",
    rarity_tier: "Common",
    rarity_color: "#8a8f98",
    weight: 70,
    remaining_qty: 15,
  },
];

/**
 * Seeds a real, persistent demo mystery-pull pool for manual QA of the
 * storefront buy -> checkout -> SumUp -> reveal flow end to end. Unlike
 * this repo's _tmp-* throwaway scripts, this one is meant to stay in the
 * codebase and its output is meant to stay in the database — re-run it any
 * time to reset the demo pool back to this fixed shape (it cleans up its
 * own prior run by theme_key first, dismissing links before deleting
 * records per CLAUDE.md's Mystery Pull module note, so re-running never
 * leaves an orphaned link behind).
 *
 * Run with: npx medusa exec ./src/scripts/seed-demo-mystery-pull.ts
 */
export default async function seedDemoMysteryPull({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);
  const mysteryPullModuleService: MysteryPullModuleService =
    container.resolve(MYSTERY_PULL_MODULE);

  // --- 0. Clean up a previous run of this exact demo pool, if any. ---
  const { data: existingPools } = await query.graph({
    entity: "pull_pool",
    fields: ["id", "product.id", "outcomes.id", "outcomes.product_variant.id"],
    filters: { theme_key: THEME_KEY } as any,
  });
  for (const pool of existingPools as any[]) {
    for (const outcome of pool.outcomes ?? []) {
      if (outcome.product_variant?.id) {
        await link.dismiss({
          [MYSTERY_PULL_MODULE]: { pull_outcome_id: outcome.id },
          [Modules.PRODUCT]: { product_variant_id: outcome.product_variant.id },
        });
      }
    }
    if (pool.outcomes?.length) {
      await mysteryPullModuleService.deletePullOutcomes(
        pool.outcomes.map((o: any) => o.id)
      );
    }
    if (pool.product?.id) {
      await link.dismiss({
        [Modules.PRODUCT]: { product_id: pool.product.id },
        [MYSTERY_PULL_MODULE]: { pull_pool_id: pool.id },
      });
    }
    await mysteryPullModuleService.deletePullPools([pool.id]);
  }
  if (existingPools.length) {
    logger.info(`Removed ${existingPools.length} pool(s) from a previous run of this script.`);
  }

  // --- 1. Resolve the pack product + a real pack-art image URL. ---
  const { data: packProducts } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "variants.id", "categories.id"],
    filters: { handle: PACK_PRODUCT_HANDLE },
  });
  const packProduct = packProducts[0] as any;
  if (!packProduct) {
    throw new Error(`Pack product "${PACK_PRODUCT_HANDLE}" not found.`);
  }

  const { data: artSourceProducts } = await query.graph({
    entity: "product",
    fields: ["thumbnail"],
    filters: { handle: "test-charizard-ex-card-fields" },
  });
  const packArtUrl = (artSourceProducts[0] as any)?.thumbnail ?? null;

  // --- 2. Make sure the pack product is in the Mystery Pulls category. ---
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: MYSTERY_PULLS_CATEGORY_HANDLE } as any,
  });
  const category = categories[0];
  if (!category) {
    throw new Error(
      `"Mystery Pulls" category not found — run seed-product-categories.ts first.`
    );
  }
  const existingCategoryIds: string[] = (packProduct.categories ?? []).map(
    (c: any) => c.id
  );
  if (!existingCategoryIds.includes(category.id)) {
    const productModuleService = container.resolve(Modules.PRODUCT);
    await productModuleService.updateProducts(packProduct.id, {
      category_ids: [...existingCategoryIds, category.id],
    });
    logger.info(`Assigned "${packProduct.title}" to the Mystery Pulls category.`);
  }

  // --- 3. Create the pool and link it to the pack product. ---
  const pullPool = await mysteryPullModuleService.createPullPools({
    theme_key: THEME_KEY,
    pack_art_url: packArtUrl,
    is_active: true,
  });
  await link.create({
    [Modules.PRODUCT]: { product_id: packProduct.id },
    [MYSTERY_PULL_MODULE]: { pull_pool_id: pullPool.id },
  });
  logger.info(`Created pull_pool ${pullPool.id} linked to "${packProduct.title}".`);

  // --- 4. Create outcomes, each linked to a distinct real product/variant. ---
  for (const def of OUTCOME_PRODUCT_HANDLES) {
    const { data: outcomeProducts } = await query.graph({
      entity: "product",
      fields: ["id", "title", "variants.id"],
      filters: { handle: def.handle },
    });
    const outcomeProduct = outcomeProducts[0] as any;
    if (!outcomeProduct) {
      throw new Error(`Outcome product "${def.handle}" not found.`);
    }
    const outcomeVariant = outcomeProduct.variants[0];

    // Clear any stale link on this exact variant from an earlier ad hoc
    // test run (pull_outcome<->product_variant is a 1:1 link — see
    // CLAUDE.md's Mystery Pull module note).
    const { rows: staleOutcomeLinks } = await knex.raw(
      `select pull_outcome_id from mystery_pull_pull_outcome_product_product_variant where product_variant_id = ? and deleted_at is null`,
      [outcomeVariant.id]
    );
    for (const row of staleOutcomeLinks as { pull_outcome_id: string }[]) {
      await link.dismiss({
        [MYSTERY_PULL_MODULE]: { pull_outcome_id: row.pull_outcome_id },
        [Modules.PRODUCT]: { product_variant_id: outcomeVariant.id },
      });
    }

    const outcome = await mysteryPullModuleService.createPullOutcomes({
      pool_id: pullPool.id,
      rarity_tier: def.rarity_tier,
      rarity_color: def.rarity_color,
      weight: def.weight,
      linked_product_id: outcomeProduct.id,
      linked_variant_id: outcomeVariant.id,
      remaining_qty: def.remaining_qty,
    });
    await link.create({
      [MYSTERY_PULL_MODULE]: { pull_outcome_id: outcome.id },
      [Modules.PRODUCT]: { product_variant_id: outcomeVariant.id },
    });
    logger.info(
      `Created outcome "${def.rarity_tier}" (${outcome.id}) — prize: "${outcomeProduct.title}", qty ${def.remaining_qty}.`
    );
  }

  logger.info(
    `\nDemo mystery pull ready: buy "${packProduct.title}" at /products/${packProduct.handle} to try the real flow.\n`
  );
}
