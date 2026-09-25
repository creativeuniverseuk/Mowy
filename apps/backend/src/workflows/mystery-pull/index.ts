import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { InventoryLevelWorkflowEvents } from "@medusajs/framework/utils";
import { emitEventStep } from "@medusajs/medusa/core-flows";
import { assignOutcomeStep } from "./assign-outcome";
import { decrementInventoryForOutcomeStep } from "./decrement-inventory";
import { writeOutcomeMetadataStep } from "./write-outcome-metadata";

export type AssignMysteryPullOutcomeWorkflowInput = {
  pool_id: string;
  line_item_id: string;
};

/**
 * Draws one outcome from a mystery-pull pool, decrements its real
 * inventory, and stamps it onto the given order line item's metadata.
 * Intended to run exactly once per eligible line item, triggered by the
 * payment.captured subscriber — see
 * src/subscribers/mystery-pull-assign-on-capture.ts.
 *
 * Each step below is independently compensable, which is what makes the
 * three-part assignment genuinely all-or-nothing: if inventory decrement
 * fails, Medusa's workflow engine automatically compensates the already-
 * completed assign-outcome step (restoring remaining_qty / pool is_active);
 * if writing metadata fails, both prior steps get compensated in reverse
 * order.
 *
 * "Intended to run exactly once per eligible line item" above is enforced
 * two ways, not one: eligibility checks upstream (in the subscriber and
 * the reconciliation sweep) that read whether a line item already has a
 * result, and — the one that actually can't be wrong — a unique
 * constraint on `pull_assignment.line_item_id` that assign-outcome.ts
 * writes to inside its own locked transaction. See that step's doc
 * comment and CLAUDE.md's Mystery Pull module note for why the upstream
 * checks alone were once not enough.
 */
export const assignMysteryPullOutcomeWorkflow = createWorkflow(
  "assign-mystery-pull-outcome",
  (input: AssignMysteryPullOutcomeWorkflowInput) => {
    const outcome = assignOutcomeStep({
      pool_id: input.pool_id,
      line_item_id: input.line_item_id,
    });

    const decrement = decrementInventoryForOutcomeStep({ outcome });

    // The decrement step calls the inventory module directly, which — unlike
    // Medusa's own inventory workflows — emits no event, so the storefront's
    // cached stock badge for the prize card would otherwise go stale (see
    // src/subscribers/product-changed.ts). Same event and `{ id }` payload
    // the core update-inventory-levels workflow emits. emitEventStep only
    // releases it once the whole workflow succeeds, so a compensated
    // (rolled-back) pull never triggers a revalidation.
    when({ decrement }, ({ decrement }) => decrement.decremented).then(() => {
      emitEventStep({
        eventName: InventoryLevelWorkflowEvents.UPDATED,
        data: transform({ decrement }, ({ decrement }) => ({
          id: decrement.inventory_level_id,
        })),
      });
    });

    writeOutcomeMetadataStep({
      line_item_id: input.line_item_id,
      outcome,
    });

    return new WorkflowResponse(outcome);
  }
);

export default assignMysteryPullOutcomeWorkflow;
