import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { CARD_DETAIL_MODULE } from "../modules/card_detail";
import CardDetailModuleService from "../modules/card_detail/service";

const TEST_HANDLE = "test-charizard-ex-card-fields";

/**
 * Smoke test: creates a product, attaches trading-card attributes via the
 * card_detail module + product<->card_detail link, then reads the product
 * back through query.graph to prove the link resolves.
 *
 * Run with: npx medusa exec ./src/scripts/create-product-with-card-fields.ts
 */
export default async function createProductWithCardFields({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const cardDetailModuleService: CardDetailModuleService = container.resolve(
    CARD_DETAIL_MODULE
  );

  // Clean up a previous run of this test, if any, so it can be re-run safely.
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { handle: TEST_HANDLE },
  });
  if (existing.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: existing.map((p) => p.id) },
    });
    logger.info("Removed product from a previous test run.");
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfiles[0];

  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const [salesChannel] = await salesChannelModuleService.listSalesChannels({});

  // 1. Create the product.
  const {
    result: [product],
  } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Charizard ex 208/197 - Holo",
          handle: TEST_HANDLE,
          status: "published" as any,
          shipping_profile_id: shippingProfile.id,
          options: [{ title: "Language", values: ["English"] }],
          variants: [
            {
              title: "English",
              sku: "PKM-CHZ-EX-208-197-HOLO",
              options: { Language: "English" },
              prices: [{ amount: 3999, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
      ],
    },
  });
  logger.info(`Created product "${product.title}" (${product.id}).`);

  // 2. Create the card_detail record.
  const cardDetail = await cardDetailModuleService.createCardDetails({
    card_set: "Obsidian Flames",
    rarity: "Double Rare",
    condition: "Near Mint",
    is_graded: true,
    grading_company: "PSA",
    grade: 10,
  });
  logger.info(`Created card_detail (${cardDetail.id}).`);

  // 3. Link the product to its card_detail record.
  await link.create({
    [Modules.PRODUCT]: { product_id: product.id },
    [CARD_DETAIL_MODULE]: { card_detail_id: cardDetail.id },
  });
  logger.info("Linked product to card_detail.");

  // 4. Read the product back through the link to prove it resolves.
  const { data: verified } = await query.graph({
    entity: "product",
    fields: ["id", "title", "card_detail.*"],
    filters: { id: product.id },
  });

  logger.info(`\nVerification result:\n${JSON.stringify(verified, null, 2)}\n`);

  const linkedCardDetail = (verified[0] as any).card_detail;
  if (linkedCardDetail?.rarity === "Double Rare") {
    logger.info("PASS: product <-> card_detail link resolved correctly.");
  } else {
    logger.info("FAIL: card_detail did not resolve on the product.");
  }
}
