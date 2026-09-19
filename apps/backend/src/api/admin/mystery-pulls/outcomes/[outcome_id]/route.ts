import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { MYSTERY_PULL_MODULE } from "../../../../../modules/mystery_pull";
import MysteryPullModuleService from "../../../../../modules/mystery_pull/service";

/**
 * Updates an outcome's rarity/weight/stock fields only — deliberately does
 * not support changing the linked product/variant here. Re-pointing the
 * prize would mean dismissing one product_variant link and creating
 * another, which needs its own "is this variant already used elsewhere"
 * handling identical to creation; simpler and just as usable for a family
 * member to delete the outcome and add a new one with the right prize.
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { outcome_id } = req.params;
  const body = req.body as {
    rarity_tier?: string;
    rarity_color?: string;
    weight?: number;
    remaining_qty?: number;
  };

  const mysteryPullModuleService: MysteryPullModuleService = req.scope.resolve(
    MYSTERY_PULL_MODULE
  );

  const [outcome] = await mysteryPullModuleService.updatePullOutcomes([
    { id: outcome_id, ...body },
  ]);

  res.json({ outcome });
}

/**
 * Dismisses the outcome<->variant link before deleting the record — see
 * CLAUDE.md's Mystery Pull module note: the module service's delete
 * methods and the Link module are independent, so skipping this step
 * would leave a soft-deleted-but-present link row blocking that variant
 * from ever being used as a prize again.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { outcome_id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const mysteryPullModuleService: MysteryPullModuleService = req.scope.resolve(
    MYSTERY_PULL_MODULE
  );

  const { data: outcomes } = await query.graph({
    entity: "pull_outcome",
    fields: ["id", "product_variant.id"],
    filters: { id: outcome_id } as any,
  });
  const outcome = outcomes[0] as any;

  if (!outcome) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Outcome "${outcome_id}" not found.`
    );
  }

  if (outcome.product_variant?.id) {
    await link.dismiss({
      [MYSTERY_PULL_MODULE]: { pull_outcome_id: outcome_id },
      [Modules.PRODUCT]: { product_variant_id: outcome.product_variant.id },
    });
  }

  await mysteryPullModuleService.deletePullOutcomes([outcome_id]);

  res.status(204).send();
}
