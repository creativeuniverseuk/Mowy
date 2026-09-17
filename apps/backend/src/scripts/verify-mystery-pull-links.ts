import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MYSTERY_PULL_MODULE } from "../modules/mystery_pull";
import MysteryPullModuleService from "../modules/mystery_pull/service";

const TEST_PRODUCT_HANDLE = "test-charizard-ex-card-fields";
const TEST_THEME_KEY = "verify-mystery-pull-links";

/**
 * Smoke test: creates a pull_pool linked to a real product, a pull_outcome
 * linked to that product's real variant, then reads both back through
 * query.graph to prove product -> pull_pool and pull_outcome -> variant
 * both resolve. Deletes the test pull_pool/pull_outcome (and their links)
 * at the end either way — the linked product/variant are pre-existing
 * catalog data and are left untouched.
 *
 * Run with: npx medusa exec ./src/scripts/verify-mystery-pull-links.ts
 */
export default async function verifyMysteryPullLinks({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const mysteryPullModuleService: MysteryPullModuleService =
    container.resolve(MYSTERY_PULL_MODULE);

  // 0. Clean up a previous run of this test, if any.
  const { data: existingPools } = await query.graph({
    entity: "pull_pool",
    fields: ["id"],
    filters: { theme_key: TEST_THEME_KEY } as any,
  });
  if (existingPools.length) {
    const { data: existingOutcomes } = await query.graph({
      entity: "pull_outcome",
      fields: ["id"],
      filters: { pool_id: existingPools.map((p) => p.id) } as any,
    });
    if (existingOutcomes.length) {
      await mysteryPullModuleService.deletePullOutcomes(
        existingOutcomes.map((o) => o.id)
      );
    }
    await mysteryPullModuleService.deletePullPools(
      existingPools.map((p) => p.id)
    );
    logger.info("Removed pull_pool/pull_outcome from a previous test run.");
  }

  // 1. Find a real product + variant already in the catalog.
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "variants.id", "variants.title"],
    filters: { handle: TEST_PRODUCT_HANDLE },
  });
  const product = products[0];
  if (!product) {
    throw new Error(
      `Test product "${TEST_PRODUCT_HANDLE}" not found — cannot verify links without a real product/variant.`
    );
  }
  const variant = (product as any).variants[0];
  if (!variant) {
    throw new Error(`Product "${product.title}" has no variants.`);
  }
  logger.info(
    `Using existing product "${product.title}" (${product.id}), variant "${variant.title}" (${variant.id}).`
  );

  // 2. Create the pull_pool record and link it to the product.
  const pullPool = await mysteryPullModuleService.createPullPools({
    theme_key: TEST_THEME_KEY,
    pack_art_url: null,
    is_active: true,
  });
  logger.info(`Created pull_pool (${pullPool.id}).`);

  await link.create({
    [Modules.PRODUCT]: { product_id: product.id },
    [MYSTERY_PULL_MODULE]: { pull_pool_id: pullPool.id },
  });
  logger.info("Linked product to pull_pool.");

  // 3. Create the pull_outcome record and link it to the product's variant.
  const pullOutcome = await mysteryPullModuleService.createPullOutcomes({
    pool_id: pullPool.id,
    rarity_tier: "Double Rare",
    rarity_color: "#3b6eff",
    weight: 10,
    linked_product_id: product.id,
    linked_variant_id: variant.id,
    remaining_qty: 5,
  });
  logger.info(`Created pull_outcome (${pullOutcome.id}).`);

  await link.create({
    [MYSTERY_PULL_MODULE]: { pull_outcome_id: pullOutcome.id },
    [Modules.PRODUCT]: { product_variant_id: variant.id },
  });
  logger.info("Linked pull_outcome to product variant.");

  // 4. Read both links back through query.graph to prove they resolve.
  const { data: verifiedProduct } = await query.graph({
    entity: "product",
    fields: ["id", "title", "pull_pool.*"],
    filters: { id: product.id },
  });
  logger.info(
    `\nproduct -> pull_pool:\n${JSON.stringify(verifiedProduct, null, 2)}\n`
  );

  const { data: verifiedOutcome } = await query.graph({
    entity: "pull_outcome",
    fields: ["id", "rarity_tier", "remaining_qty", "product_variant.*"],
    filters: { id: pullOutcome.id } as any,
  });
  logger.info(
    `\npull_outcome -> product_variant:\n${JSON.stringify(verifiedOutcome, null, 2)}\n`
  );

  const linkedPool = (verifiedProduct[0] as any).pull_pool;
  const linkedVariant = (verifiedOutcome[0] as any).product_variant;

  const productPass = linkedPool?.id === pullPool.id;
  const outcomePass = linkedVariant?.id === variant.id;

  logger.info(
    productPass
      ? "PASS: product <-> pull_pool link resolved correctly."
      : "FAIL: pull_pool did not resolve on the product."
  );
  logger.info(
    outcomePass
      ? "PASS: pull_outcome <-> product_variant link resolved correctly."
      : "FAIL: product_variant did not resolve on the pull_outcome."
  );

  // 5. Clean up: dismiss both links first (deleting the module records
  // directly does not cascade-delete link-table rows — confirmed by
  // inspection, so this must happen explicitly), then delete the test
  // pull_outcome/pull_pool. The linked product/variant are real
  // pre-existing catalog data — left untouched.
  await link.dismiss({
    [MYSTERY_PULL_MODULE]: { pull_outcome_id: pullOutcome.id },
    [Modules.PRODUCT]: { product_variant_id: variant.id },
  });
  await link.dismiss({
    [Modules.PRODUCT]: { product_id: product.id },
    [MYSTERY_PULL_MODULE]: { pull_pool_id: pullPool.id },
  });
  await mysteryPullModuleService.deletePullOutcomes([pullOutcome.id]);
  await mysteryPullModuleService.deletePullPools([pullPool.id]);
  logger.info("Cleaned up test pull_outcome, pull_pool, and their links.");

  if (!productPass || !outcomePass) {
    throw new Error("Verification failed — see PASS/FAIL lines above.");
  }
}
