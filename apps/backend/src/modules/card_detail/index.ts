import { Module } from "@medusajs/framework/utils";
import CardDetailModuleService from "./service";

export const CARD_DETAIL_MODULE = "card_detail";

export default Module(CARD_DETAIL_MODULE, {
  service: CardDetailModuleService,
});
