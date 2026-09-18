import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { fetchLineItemMetadata } from "../../../../../../workflows/mystery-pull/line-item-metadata";

/**
 * Deliberately unauthenticated — this used to require customer auth
 * (`authenticate("customer", ...)`) and scope the lookup to
 * req.auth_context.actor_id, but that made the reveal permanently
 * unreachable for a guest checkout (no session ever exists to authenticate
 * with), which is a normal, supported way to buy a mystery pull in this
 * app. Switched to matching core Medusa's own precedent for exactly this
 * situation: GET /store/orders/:id (see
 * @medusajs/medusa/api/store/orders/[id]/route.ts) is intentionally
 * unauthenticated too, with its own doc comment explaining why — the order
 * id is a ULID that requires brute-forcing to guess, so the id itself is
 * the access-control mechanism, not a session. Same reasoning applies
 * here identically: this route is reached only via a link containing the
 * real order id (the SumUp return flow, or the customer's own order
 * history), so requiring a *second* secret (a valid session) on top of
 * that doesn't add real security — it only breaks the guest-checkout case.
 *
 * Returns 404 whether the order doesn't exist, has no mystery-pull line
 * item, or assignment simply hasn't run yet — so a caller probing order
 * ids can't distinguish "no such order" from "not ready yet".
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { order_id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const notFound = () =>
    new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No assigned mystery pull result was found for order "${order_id}".`
    );

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "items.id", "items.product.pull_pool.id"],
    filters: { id: order_id } as any,
  });
  const order = orders[0] as any;

  if (!order) {
    throw notFound();
  }

  const pullItem = (order.items ?? []).find(
    (item: any) => item.product?.pull_pool?.id
  );

  if (!pullItem) {
    throw notFound();
  }

  // Deliberately not query.graph for the metadata itself — see
  // fetchLineItemMetadata's doc comment. Confirmed by direct testing: this
  // route querying "items.metadata" (or "items.line_item_metadata")
  // returned {} unpredictably on line items that genuinely had
  // won_product_id set, independent of field name or elapsed time. This
  // raw-SQL read was reliable in every one of those same tests.
  const metadata = await fetchLineItemMetadata(req.scope, pullItem.id);
  if (!metadata) {
    throw notFound();
  }

  const { won_product_id, won_variant_id, rarity_tier, rarity_color } = metadata;

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
