import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { revalidateStorefront } from "../lib/revalidate-storefront";

/**
 * Tells the storefront to drop its cached product listings after a product
 * or variant changes in the admin (see src/lib/revalidate-storefront.ts).
 *
 * The variant events matter as much as the product ones: **editing a
 * variant's price emits only `product-variant.updated`, never
 * `product.updated`**. The admin's Variants → Edit prices screen calls
 * POST /admin/products/:id/variants/batch → batchProductVariantsWorkflow →
 * updateProductVariantsWorkflow, which emits just the variant event. With
 * only the product events subscribed, a price change never reached the
 * storefront's force-cached product data, and the old price stayed up
 * indefinitely.
 *
 * Stock is the same story. The storefront's cached product data includes
 * each variant's `inventory_quantity` (stocked minus reserved), which drives
 * the in-stock / low-stock / out-of-stock badges, and no product event
 * fires when it changes:
 * - admin stock edits (updateInventoryLevelsWorkflow /
 *   batchInventoryItemLevelsWorkflow) → `inventory-level.created/updated`
 * - checkout reserving stock (completeCartWorkflow) → `reservation-item.created`
 *   — the one that matters most for one-of-a-kind cards: once sold, the
 *   listing should show out of stock straight away
 * - fulfilment → `inventory-level.updated` + `reservation-item.updated/deleted`
 * - order cancellation → `reservation-item.deleted`
 * - Mystery Pull prize payouts → `inventory-level.updated`, emitted by
 *   src/workflows/mystery-pull/index.ts itself, since its decrement step
 *   calls the inventory module directly.
 *
 * Price lists (sales/overrides) emit no events at all in Medusa 2.21, so
 * they're covered separately, by a middleware on the admin's price-list
 * routes (src/api/middlewares.ts).
 */
export default async function productChangedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  await revalidateStorefront(
    logger,
    `product-changed subscriber (${event.name})`
  );
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "inventory-level.created",
    "inventory-level.updated",
    "inventory-level.deleted",
    "reservation-item.created",
    "reservation-item.updated",
    "reservation-item.deleted",
  ],
};
