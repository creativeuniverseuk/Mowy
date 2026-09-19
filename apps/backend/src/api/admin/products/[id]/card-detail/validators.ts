import { z } from "@medusajs/framework/zod";

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

// Grades allow one decimal place (PSA/BGS/CGC half-points like 9.5). Anything
// finer would look stored-as-entered but isn't a real grade, so reject it here
// rather than let a typo like 9.55 through. The tolerance absorbs float noise
// (1.1 * 10 === 11.000000000000002).
const hasAtMostOneDecimal = (value: number) =>
  Math.abs(value * 10 - Math.round(value * 10)) < 1e-6;

export const AdminUpsertCardDetail = z.object({
  card_set: requiredText("card_set"),
  rarity: requiredText("rarity"),
  condition: requiredText("condition"),
  is_graded: z.boolean(),
  grading_company: z.string().trim().min(1).nullish(),
  grade: z
    .number()
    .positive("grade must be greater than 0")
    .refine(hasAtMostOneDecimal, "grade can have at most one decimal place")
    .nullish(),
});

export type AdminUpsertCardDetailType = z.infer<typeof AdminUpsertCardDetail>;
