import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

const PUBLISHABLE_KEY_TITLE = "MOWY Storefront";

/**
 * Ensures a GBP-currency United Kingdom region, GB tax region, default sales
 * channel, and a publishable API key exist. Safe to run multiple times.
 *
 * Run with: npx medusa exec ./src/scripts/seed-gb-region.ts
 */
export default async function seedGbRegion({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const storeModuleService = container.resolve(Modules.STORE);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const apiKeyModuleService = container.resolve(Modules.API_KEY);

  const [store] = await storeModuleService.listStores();

  // 1. Make sure the store accepts GBP and defaults to it.
  const currentCurrencies = store.supported_currencies ?? [];
  const alreadyDefaultGbp = currentCurrencies.some(
    (c) => c.currency_code === "gbp" && c.is_default
  );
  if (!alreadyDefaultGbp) {
    const supported_currencies = [
      { currency_code: "gbp", is_default: true },
      ...currentCurrencies
        .filter((c) => c.currency_code !== "gbp")
        .map((c) => ({ currency_code: c.currency_code, is_default: false })),
    ];
    await updateStoresWorkflow(container).run({
      input: { selector: { id: store.id }, update: { supported_currencies } },
    });
    logger.info("Store now supports GBP as its default currency.");
  } else {
    logger.info("Store already defaults to GBP.");
  }

  // 2. Create the UK region if it doesn't exist yet. A country can only
  // belong to one region, so first detach "gb" from any other region
  // (e.g. a demo "Europe" region) that may already claim it.
  let [region] = await regionModuleService.listRegions({
    currency_code: "gbp",
  });
  if (!region) {
    const regionsWithCountries = await regionModuleService.listRegions(
      {},
      { relations: ["countries"] }
    );
    const conflicting = regionsWithCountries.find((r) =>
      r.countries?.some((c) => c.iso_2 === "gb")
    );
    if (conflicting) {
      const remainingCountries = conflicting.countries
        .filter((c) => c.iso_2 !== "gb")
        .map((c) => c.iso_2);
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: conflicting.id },
          update: { countries: remainingCountries },
        },
      });
      logger.info(
        `Removed "gb" from region "${conflicting.name}" so it can be reassigned.`
      );
    }
  }
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United Kingdom",
            currency_code: "gbp",
            countries: ["gb"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = result[0];
    logger.info(`Created region "United Kingdom" (${region.id}).`);
  } else {
    logger.info(`Region "${region.name}" already exists (${region.id}).`);
  }

  // 3. Create a GB tax region if it doesn't exist yet.
  const [taxRegion] = await taxModuleService.listTaxRegions({
    country_code: "gb",
  });
  if (!taxRegion) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "gb", provider_id: "tp_system" }],
    });
    logger.info("Created GB tax region.");
  } else {
    logger.info("GB tax region already exists.");
  }

  // 4. Resolve (or create) the default sales channel.
  let salesChannel = store.default_sales_channel_id
    ? await salesChannelModuleService
        .retrieveSalesChannel(store.default_sales_channel_id)
        .catch(() => null)
    : null;

  if (!salesChannel) {
    const [existing] = await salesChannelModuleService.listSalesChannels({});
    if (existing) {
      salesChannel = existing;
    } else {
      const { result } = await createSalesChannelsWorkflow(container).run({
        input: {
          salesChannelsData: [
            {
              name: "MOWY Storefront",
              description: "Default web storefront",
            },
          ],
        },
      });
      salesChannel = result[0];
    }
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: { default_sales_channel_id: salesChannel.id },
      },
    });
    logger.info(`Default sales channel set to "${salesChannel.name}".`);
  } else {
    logger.info(`Default sales channel already set to "${salesChannel.name}".`);
  }

  // 5. Create a publishable API key linked to that sales channel.
  const [existingKey] = await apiKeyModuleService.listApiKeys({
    type: "publishable",
    title: PUBLISHABLE_KEY_TITLE,
  });

  let publishableKey = existingKey;
  if (!publishableKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: PUBLISHABLE_KEY_TITLE,
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });
    publishableKey = result[0];
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: publishableKey.id, add: [salesChannel.id] },
    });
    logger.info("Created publishable API key and linked it to the sales channel.");
  } else {
    logger.info("Publishable API key already exists.");
  }

  logger.info(
    `\nMOWY_PUBLISHABLE_API_KEY=${publishableKey.token}\n(sales channel: ${salesChannel.name}, region: ${region.name} / ${region.currency_code.toUpperCase()})\n`
  );
}
