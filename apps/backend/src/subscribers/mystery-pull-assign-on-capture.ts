import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { assignMysteryPullOutcomeWorkflow } from "../workflows/mystery-pull";

/**
 * Draws a mystery-pull outcome for every order line item whose product is a
 * mystery-pull pool — but only once payment has actually been captured.
 * Assignment must never happen before payment (that's the whole point of a
 * "mystery" pull backed by real inventory): drawing on `order.placed` or at
 * checkout time would let an abandoned/failed payment still consume a
 * scarce outcome and its inventory.
 *
 * Guards against running twice for the same line item (event redelivery,
 * multiple payments on one order, etc.) by checking whether the line item
 * already carries a `won_product_id` in its metadata before drawing.
 */
export default async function mysteryPullAssignOnCapture({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: payments } = await query.graph({
    entity: "payment",
    fields: [
      "id",
      "payment_collection.order.id",
      "payment_collection.order.items.id",
      "payment_collection.order.items.product_id",
      "payment_collection.order.items.metadata",
      "payment_collection.order.items.product.pull_pool.id",
      "payment_collection.order.items.product.pull_pool.is_active",
    ],
    filters: { id: data.id },
  });

  const order = (payments[0] as any)?.payment_collection?.order;
  if (!order) {
    // Not every captured payment belongs to an order (e.g. it could still
    // be mid-checkout) — nothing to do yet.
    return;
  }

  const eligibleItems = (order.items ?? []).filter((item: any) => {
    const pool = item.product?.pull_pool;
    const alreadyAssigned = Boolean(item.metadata?.won_product_id);
    return pool?.id && pool.is_active && !alreadyAssigned;
  });

  if (!eligibleItems.length) {
    return;
  }

  for (const item of eligibleItems) {
    try {
      const { result } = await assignMysteryPullOutcomeWorkflow(container).run({
        input: {
          pool_id: item.product.pull_pool.id,
          line_item_id: item.id,
        },
      });
      logger.info(
        `mystery-pull-assign-on-capture: order ${order.id} line item ${item.id} won outcome ${result.id} (${result.rarity_tier}).`
      );
    } catch (error: any) {
      // A sold-out pool (or any other assignment failure) shouldn't crash
      // the rest of the order's processing or other line items' draws —
      // log it clearly so it can be followed up on (refund/replacement),
      // and move on.
      logger.error(
        `mystery-pull-assign-on-capture: failed to assign an outcome for order ${order.id} line item ${item.id}: ${error.message}`
      );
    }
  }
}

export const config: SubscriberConfig = {
  event: "payment.captured",
};
