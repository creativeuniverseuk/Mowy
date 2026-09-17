import { MedusaService } from "@medusajs/framework/utils";
import PullPool from "./models/pull-pool";
import PullOutcome from "./models/pull-outcome";

class MysteryPullModuleService extends MedusaService({
  PullPool,
  PullOutcome,
}) {}

export default MysteryPullModuleService;
