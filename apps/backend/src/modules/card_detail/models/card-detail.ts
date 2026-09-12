import { model } from "@medusajs/framework/utils";

const CardDetail = model.define("card_detail", {
  id: model.id().primaryKey(),
  card_set: model.text(),
  rarity: model.text(),
  condition: model.text(),
  is_graded: model.boolean().default(false),
  grading_company: model.text().nullable(),
  grade: model.number().nullable(),
});

export default CardDetail;
