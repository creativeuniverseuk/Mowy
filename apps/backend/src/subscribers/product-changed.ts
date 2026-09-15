import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Tells the storefront to drop its cached product listings after a
 * create/update/delete in the admin (see CLAUDE.md / the storefront's
 * src/app/api/revalidate/route.ts) — otherwise category pages, the
 * homepage, and related-products keep serving whatever was cached at last
 * visit (wrong thumbnail/price, or a deleted product still listed) until
 * something else happens to bust it.
 */
export default async function productChangedHandler({
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const storefrontUrl = process.env.STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!storefrontUrl || !secret) {
    logger.warn(
      "product-changed subscriber: STOREFRONT_URL or REVALIDATE_SECRET not set, skipping storefront revalidation."
    );
    return;
  }

  const url = `${storefrontUrl.replace(/\/$/, "")}/api/revalidate?secret=${encodeURIComponent(
    secret
  )}&tags=products`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      logger.warn(
        `product-changed subscriber: storefront revalidation returned ${response.status}.`
      );
    }
  } catch (error) {
    logger.warn(
      `product-changed subscriber: failed to reach storefront revalidation endpoint — ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
};
