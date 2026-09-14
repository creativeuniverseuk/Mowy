import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { LinkDefinition } from "@medusajs/framework/types";
import { CARD_DETAIL_MODULE } from "../../modules/card_detail";
import CardDetailModuleService from "../../modules/card_detail/service";

type CardDetailAdditionalData = {
  card_set?: string;
  rarity?: string;
  condition?: string;
  is_graded?: boolean;
  grading_company?: string;
  grade?: number;
};

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const cardData = additional_data as CardDetailAdditionalData | undefined;

    if (!cardData?.card_set) {
      return new StepResponse([], []);
    }

    const cardDetailModuleService: CardDetailModuleService = container.resolve(
      CARD_DETAIL_MODULE
    );
    const link = container.resolve("link");

    const linksToCreate: LinkDefinition[] = [];

    for (const product of products) {
      const cardDetail = await cardDetailModuleService.createCardDetails({
        card_set: cardData.card_set,
        rarity: cardData.rarity,
        condition: cardData.condition,
        is_graded: cardData.is_graded,
        grading_company: cardData.grading_company,
        grade: cardData.grade,
      });

      linksToCreate.push({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [CARD_DETAIL_MODULE]: {
          card_detail_id: cardDetail.id,
        },
      });
    }

    await link.create(linksToCreate);

    return new StepResponse(linksToCreate, linksToCreate);
  },
  async (linksToCreate, { container }) => {
    if (!linksToCreate?.length) {
      return;
    }

    const link = container.resolve("link");
    await link.dismiss(linksToCreate);
  }
);
