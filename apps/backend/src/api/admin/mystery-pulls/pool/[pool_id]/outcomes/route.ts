import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { MYSTERY_PULL_MODULE } from "../../../../../../modules/mystery_pull";
import MysteryPullModuleService from "../../../../../../modules/mystery_pull/service";

/**
 * Creates one outcome and links it to the chosen product variant — the
 * "prize" a customer can win. pull_outcome<->product_variant is a 1:1
 * link (see src/links/pull-outcome-product.ts and CLAUDE.md's Mystery
 * Pull module note): a variant already used as a prize elsewhere can't be
 * linked again, and link.create throws "Cannot create multiple links" for
 * that case — caught below and turned into a message a family member
 * setting this up would actually understand.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { pool_id } = req.params;
  const body = req.body as {
    product_id?: string;
    variant_id?: string;
    rarity_tier?: string;
    rarity_color?: string;
    weight?: number;
    remaining_qty?: number;
  };

  if (
    !body.product_id ||
    !body.variant_id ||
    !body.rarity_tier ||
    !body.rarity_color ||
    body.weight === undefined ||
    body.remaining_qty === undefined
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "product_id, variant_id, rarity_tier, rarity_color, weight, and remaining_qty are all required."
    );
  }

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const mysteryPullModuleService: MysteryPullModuleService = req.scope.resolve(
    MYSTERY_PULL_MODULE
  );

  const outcome = await mysteryPullModuleService.createPullOutcomes({
    pool_id,
    rarity_tier: body.rarity_tier,
    rarity_color: body.rarity_color,
    weight: body.weight,
    remaining_qty: body.remaining_qty,
    linked_product_id: body.product_id,
    linked_variant_id: body.variant_id,
  });

  try {
    await link.create({
      [MYSTERY_PULL_MODULE]: { pull_outcome_id: outcome.id },
      [Modules.PRODUCT]: { product_variant_id: body.variant_id },
    });
  } catch (error: any) {
    await mysteryPullModuleService.deletePullOutcomes([outcome.id]);
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `That variant is already a prize in another outcome — each variant can only back one prize slot at a time. Pick a different product/variant, or remove it from wherever it's currently used first.`
    );
  }

  res.json({ outcome });
}
