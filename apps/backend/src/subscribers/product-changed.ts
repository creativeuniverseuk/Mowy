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
  ],
};
