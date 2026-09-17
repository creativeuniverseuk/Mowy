import { Module } from "@medusajs/framework/utils";
import MysteryPullModuleService from "./service";

export const MYSTERY_PULL_MODULE = "mystery_pull";

export default Module(MYSTERY_PULL_MODULE, {
  service: MysteryPullModuleService,
});
