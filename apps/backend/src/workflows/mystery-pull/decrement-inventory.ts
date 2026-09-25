import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { AssignedOutcome } from "./assign-outcome";

export type DecrementInventoryStepInput = {
  outcome: AssignedOutcome;
};

type DecrementInventoryOutput = {
  inventory_item_id: string | null;
  location_id: string | null;
  // The inventory level adjusted — used by the workflow to emit
  // `inventory-level.updated` with the same `{ id }` payload Medusa's own
  // inventory workflows use (see index.ts).
  inventory_level_id: string | null;
  decremented: boolean;
};

type DecrementInventoryCompensateInput = {
  inventory_item_id: string;
  location_id: string;
} | null;

/**
 * Decrements real inventory for the variant an assigned outcome pays out,
 * as its own step — see the doc comment on assign-outcome.ts for why this
 * can't just be a plain `await` tacked onto the end of that step. Only
 * applies when the outcome pays out a specific variant with inventory
 * actually tracked; otherwise this is a graceful no-op (logged), matching
 * how card-detail-only or untracked products behave elsewhere.
 *
 * Every branch passes an explicit second argument to `StepResponse`
 * (`null` for the no-op branches) rather than relying on the SDK's
 * single-argument fallback (which hands the *output* object to the
 * compensate function instead of `undefined`) — that fallback would make
 * the no-op branches' compensate call look like real compensation data
 * (an object, just with null fields), and mixing it with the real
 * compensation shape doesn't type-check as one consistent step signature
 * anyway.
 */
export const decrementInventoryForOutcomeStep = createStep(
  "decrement-mystery-pull-outcome-inventory",
  async (input: DecrementInventoryStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const inventoryModuleService = container.resolve(Modules.INVENTORY);

    if (!input.outcome.linked_variant_id) {
      const output: DecrementInventoryOutput = {
        inventory_item_id: null,
        location_id: null,
        inventory_level_id: null,
        decremented: false,
      };
      return new StepResponse<DecrementInventoryOutput, DecrementInventoryCompensateInput>(
        output,
        null
      );
    }

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "inventory_items.inventory_item_id",
        "inventory_items.inventory.location_levels.id",
        "inventory_items.inventory.location_levels.location_id",
      ],
      filters: { id: input.outcome.linked_variant_id },
    });

    const inventoryItem = (variants[0] as any)?.inventory_items?.[0];
    const inventoryItemId: string | null = inventoryItem?.inventory_item_id ?? null;
    const inventoryLevelId: string | null =
      inventoryItem?.inventory?.location_levels?.[0]?.id ?? null;
    const locationId: string | null =
      inventoryItem?.inventory?.location_levels?.[0]?.location_id ?? null;

    if (!inventoryItemId || !locationId) {
      logger.warn(
        `decrement-mystery-pull-outcome-inventory: variant ${input.outcome.linked_variant_id} has no tracked inventory item/location — skipped inventory decrement.`
      );
      const output: DecrementInventoryOutput = {
        inventory_item_id: null,
        location_id: null,
        inventory_level_id: null,
        decremented: false,
      };
      return new StepResponse<DecrementInventoryOutput, DecrementInventoryCompensateInput>(
        output,
        null
      );
    }

    await inventoryModuleService.adjustInventory(inventoryItemId, locationId, -1);

    return new StepResponse<DecrementInventoryOutput, DecrementInventoryCompensateInput>(
      {
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        inventory_level_id: inventoryLevelId,
        decremented: true,
      },
      { inventory_item_id: inventoryItemId, location_id: locationId }
    );
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) {
      return;
    }

    const inventoryModuleService = container.resolve(Modules.INVENTORY);
    await inventoryModuleService.adjustInventory(
      compensateInput.inventory_item_id,
      compensateInput.location_id,
      1
    );
  }
);
