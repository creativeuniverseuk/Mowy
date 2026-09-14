import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows";

type CategorySeed = {
  name: string;
  handle: string;
};

// Confirmed top-level categories, in display order (see CLAUDE.md > Catalogue).
const CATEGORIES: CategorySeed[] = [
  { name: "Pokémon TCG", handle: "pokemon-tcg" },
  { name: "3D-Printed Figures", handle: "3d-printed-figures" },
  { name: "Lorcana", handle: "lorcana" },
  { name: "Riftbound", handle: "riftbound" },
  { name: "Cyberpunk", handle: "cyberpunk" },
  { name: "Palworld", handle: "palworld" },
  { name: "Cataclysm: Arcade", handle: "cataclysm-arcade" },
  { name: "Mystery Pulls", handle: "mystery-pulls" },
];

/**
 * Seeds the confirmed top-level product category structure with
 * human-readable, slug-style handles. Categories are matched by handle, so
 * this is safe to run multiple times: existing categories are updated in
 * place (name/rank/active state) rather than duplicated.
 *
 * Run with: npx medusa exec ./src/scripts/seed-product-categories.ts
 */
export default async function seedProductCategories({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const existingCategories = await productModuleService.listProductCategories(
    { handle: CATEGORIES.map((category) => category.handle) }
  );
  const existingByHandle = new Map(
    existingCategories.map((category) => [category.handle, category])
  );

  const toCreate: (CategorySeed & { rank: number })[] = [];

  for (const [rank, category] of CATEGORIES.entries()) {
    const existing = existingByHandle.get(category.handle);

    if (!existing) {
      toCreate.push({ ...category, rank });
      continue;
    }

    const needsUpdate =
      existing.name !== category.name ||
      existing.rank !== rank ||
      !existing.is_active;

    if (!needsUpdate) {
      logger.info(
        `Category "${category.name}" (${category.handle}) already up to date.`
      );
      continue;
    }

    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: existing.id },
        update: { name: category.name, rank, is_active: true },
      },
    });
    logger.info(`Updated category "${category.name}" (${category.handle}).`);
  }

  if (toCreate.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: toCreate.map(({ name, handle, rank }) => ({
          name,
          handle,
          rank,
          is_active: true,
        })),
      },
    });
    for (const category of result) {
      logger.info(`Created category "${category.name}" (${category.handle}).`);
    }
  }

  logger.info("Product category seed complete.");
}
