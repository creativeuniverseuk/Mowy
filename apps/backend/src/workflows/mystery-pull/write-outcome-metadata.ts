import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { AssignedOutcome } from "./assign-outcome";

export type WriteOutcomeMetadataStepInput = {
  line_item_id: string;
  outcome: AssignedOutcome;
};

type PreviousMetadata = Record<string, unknown> | null;

/**
 * Stamps the drawn outcome onto the order line item's metadata. Merges into
 * whatever metadata the line item already has rather than replacing it —
 * `updateOrderLineItems` does not merge on its own.
 */
export const writeOutcomeMetadataStep = createStep(
  "write-mystery-pull-outcome-metadata",
  async (input: WriteOutcomeMetadataStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const orderModuleService = container.resolve(Modules.ORDER);

    const { data: items } = await query.graph({
      entity: "order_line_item",
      fields: ["id", "metadata"],
      filters: { id: input.line_item_id },
    });
    const previousMetadata: PreviousMetadata =
      (items[0] as any)?.metadata ?? null;

    const metadata = {
      ...previousMetadata,
      won_product_id: input.outcome.linked_product_id,
      won_variant_id: input.outcome.linked_variant_id,
      rarity_tier: input.outcome.rarity_tier,
      rarity_color: input.outcome.rarity_color,
    };

    await orderModuleService.updateOrderLineItems(input.line_item_id, {
      metadata,
    });

    return new StepResponse(
      { line_item_id: input.line_item_id, metadata },
      { line_item_id: input.line_item_id, previousMetadata }
    );
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) {
      return;
    }

    const orderModuleService = container.resolve(Modules.ORDER);
    await orderModuleService.updateOrderLineItems(
      compensateInput.line_item_id,
      { metadata: compensateInput.previousMetadata }
    );
  }
);
