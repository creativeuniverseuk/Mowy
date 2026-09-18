import { MedusaService } from "@medusajs/framework/utils";
import PullPool from "./models/pull-pool";
import PullOutcome from "./models/pull-outcome";
import PullAssignment from "./models/pull-assignment";

class MysteryPullModuleService extends MedusaService({
  PullPool,
  PullOutcome,
  PullAssignment,
}) {}

export default MysteryPullModuleService;
