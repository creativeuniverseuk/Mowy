import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const MYSTERY_PULLS_CATEGORY_HANDLE = "mystery-pulls";

/**
 * Confirms the "Mystery Pulls" category (seeded by seed-product-categories.ts)
 * exists, then finds every product currently linked to a pull_pool and
 * assigns it to that category if it isn't already — the mechanism that
 * makes mystery pull products reachable via the standard
 * /store/product-categories and /store/products?category_id= endpoints,
 * with no mystery-pull-specific store route needed for browsing/listing.
 *
 * Safe to run repeatedly: products already in the category are left alone,
 * and a catalog with no pull_pool-linked products yet is reported as
 * nothing-to-do rather than an error.
 *
 * Run with: npx medusa exec ./src/scripts/verify-mystery-pull-category.ts
 */
export default async function verifyMysteryPullCategory({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active"],
    filters: { handle: MYSTERY_PULLS_CATEGORY_HANDLE } as any,
  });
  const category = categories[0];

  if (!category) {
    throw new Error(
      `"Mystery Pulls" category (handle "${MYSTERY_PULLS_CATEGORY_HANDLE}") does not exist — run seed-product-categories.ts first.`
    );
  }
  logger.info(
    `Confirmed "Mystery Pulls" category exists (${category.id}, active=${category.is_active}).`
  );

  const { data: pools } = await query.graph({
    entity: "pull_pool",
    fields: ["id", "product.id", "product.title", "product.categories.id"],
    filters: {} as any,
  });

  const productsLinkedToPools = pools
    .map((pool: any) => pool.product)
    .filter((product: any) => Boolean(product));

  if (!productsLinkedToPools.length) {
    logger.info(
      "No products are linked to a pull_pool yet — nothing to assign."
    );
    return;
  }

  let updatedCount = 0;

  for (const product of productsLinkedToPools) {
    const existingCategoryIds: string[] = (product.categories ?? []).map(
      (c: any) => c.id
    );

    if (existingCategoryIds.includes(category.id)) {
      logger.info(
        `Product "${product.title}" (${product.id}) already in Mystery Pulls category.`
      );
      continue;
    }

    await productModuleService.updateProducts(product.id, {
      category_ids: [...existingCategoryIds, category.id],
    });
    logger.info(
      `Assigned product "${product.title}" (${product.id}) to Mystery Pulls category.`
    );
    updatedCount += 1;
  }

  logger.info(
    `Mystery Pulls category check complete. ${updatedCount} product(s) updated, ${
      productsLinkedToPools.length - updatedCount
    } already correct.`
  );
}
