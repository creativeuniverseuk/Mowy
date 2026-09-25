import type { Logger } from "@medusajs/framework/types";

/**
 * Tells the storefront to drop its cached data for the given tags (see the
 * storefront's src/app/(storefront)/api/revalidate/route.ts). The
 * storefront fetches product data with `cache: "force-cache"`, so without
 * this, category pages, product pages and the homepage keep serving
 * whatever was cached at last visit (wrong price, thumbnail, title, or a
 * deleted product still listed) indefinitely.
 *
 * Never throws: a failed revalidation is logged and the admin action that
 * triggered it still succeeds.
 */
export async function revalidateStorefront(
  logger: Logger,
  source: string,
  tags: string[] = ["products"]
) {
  const storefrontUrl = process.env.STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!storefrontUrl || !secret) {
    logger.warn(
      `${source}: STOREFRONT_URL or REVALIDATE_SECRET not set, skipping storefront revalidation.`
    );
    return;
  }

  const url = `${storefrontUrl.replace(/\/$/, "")}/api/revalidate?secret=${encodeURIComponent(
    secret
  )}&tags=${encodeURIComponent(tags.join(","))}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      logger.warn(
        `${source}: storefront revalidation returned ${response.status}.`
      );
    }
  } catch (error) {
    logger.warn(
      `${source}: failed to reach storefront revalidation endpoint — ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
