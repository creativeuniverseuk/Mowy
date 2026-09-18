import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { assignMysteryPullOutcomeWorkflow } from "../workflows/mystery-pull";
import { fetchAlreadyAssignedLineItemIds } from "../workflows/mystery-pull/line-item-metadata";

/**
 * Safety net for src/subscribers/mystery-pull-assign-on-capture.ts.
 *
 * That subscriber only draws an outcome when Medusa's `payment.captured`
 * domain event fires — and that event is emitted from exactly one place,
 * capturePaymentWorkflow's own emitEventStep (confirmed by reading
 * @medusajs/core-flows's payment/workflows/capture-payment.js). The
 * checkout flow this storefront actually uses
 * (completeCartWorkflow -> authorizePaymentSessionStep) captures the
 * payment through a different, service-level auto-capture path when a
 * provider's hosted checkout reports the payment as already paid at
 * authorization time — SumUp's hosted mode does exactly this. That path
 * never runs capturePaymentWorkflow, so it never emits payment.captured,
 * so the subscriber never runs, even though the payment is genuinely
 * captured and the order is real. Confirmed directly against a live test
 * order: payment.captured_at was set and a real capture record existed,
 * but the line item's metadata stayed empty and the subscriber logged
 * nothing.
 *
 * Getting SumUp's real webhook to reach this backend (via a public
 * tunnel/URL) routes captures through processPaymentWorkflow instead,
 * which *does* call capturePaymentWorkflow and *does* emit the event — so
 * in a fully-configured production deployment this sweep may rarely have
 * anything to do. But this feature hands out a real, unique physical card
 * for real money; it must not depend on any single event-delivery path
 * firing correctly every time (a webhook can also be delayed, retried, or
 * dropped by a flaky network in the real world, independent of the gap
 * above). This job re-derives eligibility straight from the database — an
 * order with a captured payment and a mystery-pull line item that has no
 * `won_product_id` yet — using the exact same eligibility rule as the
 * subscriber, and assigns it. Safe to run as often as needed: assignment
 * is keyed on that same "already assigned" check, so a line item is never
 * drawn twice.
 */
export default async function reconcileMysteryPullAssignments(
  container: MedusaContainer
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Unconditional heartbeat: without this, a run that finds nothing to do
  // logs nothing at all, which makes "is this job still scheduled" and "did
  // it silently die after the first tick" indistinguishable from the logs
  // alone. This line is the proof either way.
  logger.info(
    `reconcile-mystery-pull-assignments: tick at ${new Date().toISOString()}`
  );

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "items.id",
      "items.product_id",
      "items.product.pull_pool.id",
      "items.product.pull_pool.is_active",
      "payment_collections.status",
      "payment_collections.payments.captured_at",
    ],
    filters: {} as any,
  });

  const candidates: {
    orderId: string;
    lineItemId: string;
    poolId: string;
  }[] = [];

  for (const order of orders as any[]) {
    const isCaptured = (order.payment_collections ?? []).some(
      (pc: any) =>
        pc.status === "completed" ||
        (pc.payments ?? []).some((p: any) => Boolean(p.captured_at))
    );
    if (!isCaptured) {
      continue;
    }

    for (const item of order.items ?? []) {
      const pool = item.product?.pull_pool;
      if (pool?.id && pool.is_active) {
        candidates.push({ orderId: order.id, lineItemId: item.id, poolId: pool.id });
      }
    }
  }

  if (!candidates.length) {
    return;
  }

  // See line-item-metadata.ts's doc comment: this is a direct SQL check,
  // not query.graph, because query.graph's resolution of order item
  // metadata was confirmed unreliable by direct testing — using it here
  // would risk re-drawing (and re-decrementing real inventory for) a line
  // item that was already correctly assigned.
  const alreadyAssignedIds = await fetchAlreadyAssignedLineItemIds(
    container,
    candidates.map((c) => c.lineItemId)
  );
  const eligible = candidates.filter((c) => !alreadyAssignedIds.has(c.lineItemId));

  if (!eligible.length) {
    return;
  }

  logger.info(
    `reconcile-mystery-pull-assignments: found ${eligible.length} captured-but-unassigned mystery-pull line item(s) — assigning now.`
  );

  for (const { orderId, lineItemId, poolId } of eligible) {
    try {
      const { result } = await assignMysteryPullOutcomeWorkflow(container).run({
        input: { pool_id: poolId, line_item_id: lineItemId },
      });
      logger.info(
        `reconcile-mystery-pull-assignments: order ${orderId} line item ${lineItemId} won outcome ${result.id} (${result.rarity_tier}) via reconciliation sweep.`
      );
    } catch (error: any) {
      // Same reasoning as the subscriber: a sold-out pool or other
      // assignment failure shouldn't stop the sweep from covering the
      // rest of the batch, or the next run from trying again.
      logger.error(
        `reconcile-mystery-pull-assignments: failed to assign an outcome for order ${orderId} line item ${lineItemId}: ${error.message}`
      );
    }
  }
}

export const config = {
  name: "reconcile-mystery-pull-assignments",
  // 15 seconds, not 60: a customer is watching PullRevealOverlay poll in
  // real time waiting for this, and the storefront's own polling window
  // (see PullRevealOverlay) is sized against this worst case — the two
  // numbers must stay in that relationship, not drift apart independently.
  // Medusa's job scheduler parses this via cron-parser, which supports an
  // optional leading seconds field (confirmed against its own README, not
  // assumed) — this is 6-field cron (second minute hour day month
  // weekday), not the usual 5-field minute-granularity form. A full
  // orders scan every 15s is trivial at this catalog's scale; revisit if
  // the order volume ever makes that untrue.
  schedule: "*/15 * * * * *",
};
