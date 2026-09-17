import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
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
 */
export const assignMysteryPullOutcomeWorkflow = createWorkflow(
  "assign-mystery-pull-outcome",
  (input: AssignMysteryPullOutcomeWorkflowInput) => {
    const outcome = assignOutcomeStep({ pool_id: input.pool_id });

    decrementInventoryForOutcomeStep({ outcome });

    writeOutcomeMetadataStep({
      line_item_id: input.line_item_id,
      outcome,
    });

    return new WorkflowResponse(outcome);
  }
);

export default assignMysteryPullOutcomeWorkflow;
