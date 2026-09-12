import ProductModule from "@medusajs/medusa/product";
import CardDetailModule from "../modules/card_detail";
import { defineLink } from "@medusajs/framework/utils";

export default defineLink(
  ProductModule.linkable.product,
  CardDetailModule.linkable.cardDetail
);
