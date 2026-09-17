import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";

/**
 * Requires customer auth (see the `authenticate` middleware wired onto this
 * route's matcher in src/api/middlewares.ts). The order is looked up scoped
 * to req.auth_context.actor_id rather than by id alone — unlike core's
 * GET /store/orders/:id, which is intentionally unauthenticated and treats
 * the order id itself as the access-control secret (see that route's own
 * doc comment) — because this endpoint is specifically for revealing a
 * customer's own pull result, not general order lookup.
 *
 * Returns 404 (not 403) whether the order doesn't exist, doesn't belong to
 * this customer, has no mystery-pull line item, or assignment simply
 * hasn't run yet — so a non-owner probing order ids can't distinguish
 * "not yours" from "doesn't exist".
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { order_id } = req.params;
  const customerId = req.auth_context.actor_id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const notFound = () =>
    new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No assigned mystery pull result was found for order "${order_id}".`
    );

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "customer_id",
      "items.id",
      "items.metadata",
      "items.product.pull_pool.id",
    ],
    filters: { id: order_id } as any,
  });
  const order = orders[0] as any;

  if (!order || order.customer_id !== customerId) {
    throw notFound();
  }

  const pullItem = (order.items ?? []).find(
    (item: any) => item.product?.pull_pool?.id
  );

  if (!pullItem || !pullItem.metadata?.won_product_id) {
    throw notFound();
  }

  const { won_product_id, won_variant_id, rarity_tier, rarity_color } =
    pullItem.metadata as {
      won_product_id: string;
      won_variant_id: string | null;
      rarity_tier: string;
      rarity_color: string;
    };

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "thumbnail"],
    filters: { id: won_product_id } as any,
  });
  const wonProduct = products[0];

  res.json({
    order_id: order.id,
    line_item_id: pullItem.id,
    won_product_id,
    won_variant_id,
    rarity_tier,
    rarity_color,
    card_name: wonProduct?.title ?? null,
    image: wonProduct?.thumbnail ?? null,
  });
}
