import { model } from "@medusajs/framework/utils";

const CardDetail = model.define("card_detail", {
  id: model.id().primaryKey(),
  card_set: model.text(),
  rarity: model.text(),
  condition: model.text(),
  is_graded: model.boolean().default(false),
  grading_company: model.text().nullable(),
  // float (real), not number (integer): half-point grades like 9.5 (PSA, BGS,
  // CGC) must be stored as-is. Every one-decimal value round-trips exactly
  // through the pg driver, and unlike bigNumber it adds no companion raw_grade
  // column to API responses.
  grade: model.float().nullable(),
});

export default CardDetail;
