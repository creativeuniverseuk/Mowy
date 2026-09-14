import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";
import { MedusaError } from "@medusajs/framework/utils";

const cardAdditionalDataSchema = z
  .object({
    card_set: z.string().optional(),
    rarity: z.string().optional(),
    condition: z.string().optional(),
    is_graded: z.boolean().optional(),
    grading_company: z.string().optional(),
    grade: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.card_set) {
      return;
    }

    if (!data.rarity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rarity"],
        message: "rarity is required when card_set is provided",
      });
    }

    if (!data.condition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["condition"],
        message: "condition is required when card_set is provided",
      });
    }
  });

async function validateCardAdditionalData(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const additionalData = (req.body as { additional_data?: unknown })
    ?.additional_data;

  const result = cardAdditionalDataSchema.safeParse(additionalData ?? {});

  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    return next(
      new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid additional_data: ${message}`
      )
    );
  }

  next();
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      method: ["POST"],
      additionalDataValidator: {
        card_set: z.string().optional(),
        rarity: z.string().optional(),
        condition: z.string().optional(),
        is_graded: z.boolean().optional(),
        grading_company: z.string().optional(),
        grade: z.number().optional(),
      },
      middlewares: [validateCardAdditionalData],
    },
  ],
});
