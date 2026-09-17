import {
  authenticate,
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

// The core GET /store/products route validates `fields` against a fixed
// allowlist (@medusajs/medusa/api/store/products/query-config.ts) that has
// no idea about our card_detail link. req.allowed is the documented escape
// hatch (see MedusaRequest["allowed"] in @medusajs/framework/http) — a
// middleware can push to it before the core route's own field-validation
// middleware runs, so `fields=+card_detail.*` resolves instead of being
// silently stripped.
async function allowCardDetailFields(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.allowed ??= [];
  req.allowed.push(
    "card_detail",
    "card_detail.id",
    "card_detail.card_set",
    "card_detail.rarity",
    "card_detail.condition",
    "card_detail.is_graded",
    "card_detail.grading_company",
    "card_detail.grade",
    // "categories" is in the core route's extra-fields allowlist, but only
    // as a bare relation name — its own sub-fields (needed by the
    // storefront for related-by-category lookups) aren't, same gap as
    // card_detail above.
    "categories.id",
    "categories.name",
    "categories.handle"
  );

  next();
}

// Same gap as card_detail/categories above, for the product <-> pull_pool
// link (see src/links/product-pull-pool.ts) — needed so the storefront's
// Mystery Pulls category page can request `fields=+pull_pool.*` and get
// each product's pack art / theme key / active state back instead of
// having them silently stripped.
async function allowPullPoolFields(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.allowed ??= [];
  req.allowed.push(
    "pull_pool",
    "pull_pool.id",
    "pull_pool.theme_key",
    "pull_pool.pack_art_url",
    "pull_pool.is_active"
  );

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
    {
      matcher: "/store/products*",
      methods: ["GET"],
      middlewares: [allowCardDetailFields, allowPullPoolFields],
    },
    {
      matcher: "/store/mystery-pulls/orders/:order_id/result",
      methods: ["GET"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
});
