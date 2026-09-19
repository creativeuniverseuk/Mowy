import { Module } from "@medusajs/framework/utils";
import MysteryPullModuleService from "./service";

export const MYSTERY_PULL_MODULE = "mystery_pull";

// Matches the handle seeded by src/scripts/seed-product-categories.ts (see
// also src/scripts/verify-mystery-pull-category.ts, which used its own
// local copy of this same string before this shared constant existed).
export const MYSTERY_PULLS_CATEGORY_HANDLE = "mystery-pulls";

export default Module(MYSTERY_PULL_MODULE, {
  service: MysteryPullModuleService,
});
