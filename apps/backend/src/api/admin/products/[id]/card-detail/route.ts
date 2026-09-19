import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils";
import { CARD_DETAIL_MODULE } from "../../../../../modules/card_detail";
import CardDetailModuleService from "../../../../../modules/card_detail/service";
import { AdminUpsertCardDetailType } from "./validators";

/**
 * Saves a product's card attributes. Updates the linked card_detail record
 * when there is one; otherwise creates it and links it, so products that were
 * created without card fields (everything made through the plain admin
 * product form) can be given them from the widget too.
 *
 * Ungraded cards always store null grading_company/grade, so toggling
 * `is_graded` off can't leave stale grading data behind.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminUpsertCardDetailType>,
  res: MedusaResponse
) {
  const { id: productId } = req.params;
  const { card_set, rarity, condition, is_graded, grading_company, grade } =
    req.validatedBody;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id", "card_detail.id"],
    filters: { id: productId },
  });

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found.`
    );
  }

  const cardDetailModuleService: CardDetailModuleService = req.scope.resolve(
    CARD_DETAIL_MODULE
  );

  const values = {
    card_set,
    rarity,
    condition,
    is_graded,
    grading_company: is_graded ? grading_company ?? null : null,
    grade: is_graded ? grade ?? null : null,
  };

  if (product.card_detail?.id) {
    const [card_detail] = await cardDetailModuleService.updateCardDetails([
      { id: product.card_detail.id, ...values },
    ]);

    return res.json({ card_detail });
  }

  const card_detail = await cardDetailModuleService.createCardDetails(values);

  try {
    const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
    await link.create({
      [Modules.PRODUCT]: { product_id: productId },
      [CARD_DETAIL_MODULE]: { card_detail_id: card_detail.id },
    });
  } catch (err) {
    // Don't leave an orphaned card_detail row behind if linking fails.
    await cardDetailModuleService.deleteCardDetails(card_detail.id);
    throw err;
  }

  res.status(201).json({ card_detail });
}
