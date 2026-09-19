import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { MYSTERY_PULL_MODULE } from "../../../../../modules/mystery_pull";
import MysteryPullModuleService from "../../../../../modules/mystery_pull/service";

/**
 * Pause/reactivate toggle. Deliberately just flips `is_active` — it does
 * not touch outcomes or remaining_qty, so reactivating a pool restores
 * exactly the stock it had when paused.
 */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { pool_id } = req.params;
  const { is_active } = req.body as { is_active?: boolean };

  if (typeof is_active !== "boolean") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "is_active (boolean) is required."
    );
  }

  const mysteryPullModuleService: MysteryPullModuleService = req.scope.resolve(
    MYSTERY_PULL_MODULE
  );

  const [pool] = await mysteryPullModuleService.updatePullPools([
    { id: pool_id, is_active },
  ]);

  res.json({ pool });
}
