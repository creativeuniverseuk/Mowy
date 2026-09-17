import { model } from "@medusajs/framework/utils";

const PullOutcome = model.define("pull_outcome", {
  id: model.id().primaryKey(),
  pool_id: model.text(),
  rarity_tier: model.text(),
  rarity_color: model.text(),
  weight: model.number(),
  linked_product_id: model.text(),
  linked_variant_id: model.text().nullable(),
  remaining_qty: model.number(),
});

export default PullOutcome;
