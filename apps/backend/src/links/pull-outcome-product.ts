import ProductModule from "@medusajs/medusa/product";
import MysteryPullModule from "../modules/mystery_pull";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  MysteryPullModule.linkable.pullOutcome,
  ProductModule.linkable.productVariant
);
