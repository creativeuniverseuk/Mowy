import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  deleteFulfillmentSetsWorkflow,
  deleteProductCategoriesWorkflow,
  deleteProductOptionsWorkflow,
  deleteProductsWorkflow,
  deleteRegionsWorkflow,
  deleteShippingOptionsWorkflow,
  deleteStockLocationsWorkflow,
  deleteTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows";

const DEMO_PRODUCT_HANDLES = ["t-shirt", "sweatshirt", "sweatpants", "shorts"];
const DEMO_CATEGORY_NAMES = ["Shirts", "Sweatshirts", "Pants", "Merch"];
const DEMO_OPTION_TITLES = ["Size", "Color"];
const DEMO_STOCK_LOCATION_NAME = "European Warehouse";
const DEMO_FULFILLMENT_SET_NAME = "European Warehouse delivery";
const DEMO_SHIPPING_OPTION_NAMES = ["Standard Shipping", "Express Shipping"];
const DEMO_TAX_COUNTRIES = ["de", "dk", "se", "fr", "es", "it"];
const DEMO_REGION_NAME = "Europe";

/**
 * Removes the EUR demo data (region, products, warehouse) that Medusa's
 * create-medusa-app template auto-seeds during `db:migrate`. Safe to run
 * multiple times.
 *
 * Run with: npx medusa exec ./src/scripts/cleanup-demo-data.ts
 */
export default async function cleanupDemoData({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);

  // 1. Demo products.
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: DEMO_PRODUCT_HANDLES },
  });
  if (products.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: products.map((p) => p.id) },
    });
    logger.info(`Deleted ${products.length} demo product(s).`);
  } else {
    logger.info("No demo products found.");
  }

  // 2. Demo product categories.
  const categories = await productModuleService.listProductCategories({
    name: DEMO_CATEGORY_NAMES,
  });
  if (categories.length) {
    await deleteProductCategoriesWorkflow(container).run({
      input: categories.map((c) => c.id),
    });
    logger.info(`Deleted ${categories.length} demo product categor(y/ies).`);
  } else {
    logger.info("No demo product categories found.");
  }

  // 3. Demo product options (may already cascade with products; ignore if gone).
  const options = await productModuleService
    .listProductOptions({ title: DEMO_OPTION_TITLES })
    .catch(() => []);
  if (options.length) {
    await deleteProductOptionsWorkflow(container)
      .run({ input: { ids: options.map((o) => o.id) } })
      .catch((e) =>
        logger.info(`Skipped deleting product options: ${e.message}`)
      );
    logger.info(`Deleted ${options.length} demo product option(s).`);
  } else {
    logger.info("No demo product options found.");
  }

  // 4. Demo shipping options.
  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
    filters: { name: DEMO_SHIPPING_OPTION_NAMES },
  });
  if (shippingOptions.length) {
    await deleteShippingOptionsWorkflow(container).run({
      input: { ids: shippingOptions.map((o) => o.id) },
    });
    logger.info(`Deleted ${shippingOptions.length} demo shipping option(s).`);
  } else {
    logger.info("No demo shipping options found.");
  }

  // 5. Demo fulfillment set.
  const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets({
    name: DEMO_FULFILLMENT_SET_NAME,
  });
  if (fulfillmentSets.length) {
    await deleteFulfillmentSetsWorkflow(container).run({
      input: { ids: fulfillmentSets.map((f) => f.id) },
    });
    logger.info("Deleted demo fulfillment set.");
  } else {
    logger.info("No demo fulfillment set found.");
  }

  // 6. Demo stock location.
  const stockLocations = await stockLocationModuleService.listStockLocations({
    name: DEMO_STOCK_LOCATION_NAME,
  });
  if (stockLocations.length) {
    await deleteStockLocationsWorkflow(container).run({
      input: { ids: stockLocations.map((s) => s.id) },
    });
    logger.info("Deleted demo stock location.");
  } else {
    logger.info("No demo stock location found.");
  }

  // 7. Demo tax regions (everything except the GB one we created).
  const taxRegions = await taxModuleService.listTaxRegions({
    country_code: DEMO_TAX_COUNTRIES,
  });
  if (taxRegions.length) {
    await deleteTaxRegionsWorkflow(container).run({
      input: { ids: taxRegions.map((t) => t.id) },
    });
    logger.info(`Deleted ${taxRegions.length} demo tax region(s).`);
  } else {
    logger.info("No demo tax regions found.");
  }

  // 8. Demo "Europe" region.
  const [demoRegion] = await regionModuleService.listRegions({
    name: DEMO_REGION_NAME,
  });
  if (demoRegion) {
    await deleteRegionsWorkflow(container).run({
      input: { ids: [demoRegion.id] },
    });
    logger.info('Deleted demo "Europe" region.');
  } else {
    logger.info('No demo "Europe" region found.');
  }

  logger.info("Demo data cleanup complete.");
}
