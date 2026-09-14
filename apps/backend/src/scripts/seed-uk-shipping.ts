import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  batchLinksWorkflow,
  createLocationFulfillmentSetWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

const FULFILLMENT_PROVIDER_ID = "manual_manual";

const STOCK_LOCATION_NAME = "MOWY Warehouse";
const FULFILLMENT_SET_NAME = "MOWY Shipping";
const SERVICE_ZONE_NAME = "United Kingdom";
const SHIPPING_OPTION_NAME = "Standard UK Shipping";

/**
 * Seeds the minimal fulfillment setup a cart needs to complete: a stock
 * location (MOWY's Blackpool address, per CLAUDE.md), a "shipping" fulfillment
 * set with a GB service zone, that location linked to the default sales
 * channel, and one flat-rate UK shipping option on the Default Shipping
 * Profile. Matched by name, so safe to run multiple times.
 *
 * Run with: npx medusa exec ./src/scripts/seed-uk-shipping.ts
 */
export default async function seedUkShipping({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  // 1. Stock location.
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "fulfillment_sets.id", "fulfillment_sets.name"],
    filters: { name: STOCK_LOCATION_NAME },
  });

  let stockLocation = existingLocations[0];
  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: STOCK_LOCATION_NAME,
            address: {
              address_1: "Abingdon Street Market, Edward St",
              city: "Blackpool",
              postal_code: "FY1 1DR",
              country_code: "gb",
            },
          },
        ],
      },
    });
    stockLocation = { ...result[0], fulfillment_sets: [] } as any;
    logger.info(`Created stock location "${STOCK_LOCATION_NAME}".`);
  } else {
    logger.info(`Stock location "${STOCK_LOCATION_NAME}" already exists.`);
  }

  // 2. Fulfillment set + GB service zone.
  let fulfillmentSet = stockLocation.fulfillment_sets?.find(
    (fs: any) => fs.name === FULFILLMENT_SET_NAME
  );
  if (!fulfillmentSet) {
    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: stockLocation.id,
        fulfillment_set_data: {
          name: FULFILLMENT_SET_NAME,
          type: "shipping",
        },
      },
    });
    logger.info(`Created fulfillment set "${FULFILLMENT_SET_NAME}".`);
  } else {
    logger.info(`Fulfillment set "${FULFILLMENT_SET_NAME}" already exists.`);
  }

  const { data: refetchedLocations } = await query.graph({
    entity: "stock_location",
    fields: [
      "id",
      "fulfillment_sets.id",
      "fulfillment_sets.name",
      "fulfillment_sets.service_zones.id",
      "fulfillment_sets.service_zones.name",
    ],
    filters: { id: stockLocation.id },
  });
  fulfillmentSet = refetchedLocations[0].fulfillment_sets!.find(
    (fs: any) => fs.name === FULFILLMENT_SET_NAME
  )!;

  let serviceZoneId = fulfillmentSet.service_zones?.find(
    (sz: any) => sz.name === SERVICE_ZONE_NAME
  )?.id;
  if (!serviceZoneId) {
    const { result } = await createServiceZonesWorkflow(container).run({
      input: {
        data: [
          {
            name: SERVICE_ZONE_NAME,
            fulfillment_set_id: fulfillmentSet.id,
            geo_zones: [{ type: "country", country_code: "gb" }],
          },
        ],
      },
    });
    serviceZoneId = result[0].id;
    logger.info(`Created service zone "${SERVICE_ZONE_NAME}".`);
  } else {
    logger.info(`Service zone "${SERVICE_ZONE_NAME}" already exists.`);
  }

  // 3. Link the stock location to the default sales channel.
  const [salesChannel] = await salesChannelModuleService.listSalesChannels({});
  const { data: linkedChannels } = await query.graph({
    entity: "stock_location",
    fields: ["sales_channels.id"],
    filters: { id: stockLocation.id },
  });
  const alreadyLinked = linkedChannels[0]?.sales_channels?.some(
    (sc: any) => sc.id === salesChannel.id
  );
  if (!alreadyLinked) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [salesChannel.id] },
    });
    logger.info(`Linked stock location to sales channel "${salesChannel.name}".`);
  } else {
    logger.info(`Stock location already linked to "${salesChannel.name}".`);
  }

  // 4. Enable the manual fulfillment provider for this location (required
  // before a shipping option using it can be created).
  const { data: locationsWithProviders } = await query.graph({
    entity: "stock_location",
    fields: ["fulfillment_providers.id"],
    filters: { id: stockLocation.id },
  });
  const providerEnabled = locationsWithProviders[0]?.fulfillment_providers?.some(
    (fp: any) => fp.id === FULFILLMENT_PROVIDER_ID
  );
  if (!providerEnabled) {
    await batchLinksWorkflow(container).run({
      input: {
        create: [
          {
            [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
            [Modules.FULFILLMENT]: {
              fulfillment_provider_id: FULFILLMENT_PROVIDER_ID,
            },
          },
        ],
      },
    });
    logger.info(`Enabled fulfillment provider "${FULFILLMENT_PROVIDER_ID}" for the location.`);
  } else {
    logger.info(`Fulfillment provider "${FULFILLMENT_PROVIDER_ID}" already enabled.`);
  }

  // 5. Flat-rate UK shipping option on the Default Shipping Profile.
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  });
  const shippingProfile = shippingProfiles[0];

  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
    filters: { name: SHIPPING_OPTION_NAME },
  });

  if (!existingOptions.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: SHIPPING_OPTION_NAME,
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          provider_id: "manual_manual",
          type: {
            label: "Standard",
            description: "Standard UK shipping",
            code: "standard",
          },
          price_type: "flat",
          prices: [{ amount: 395, currency_code: "gbp" }],
        },
      ],
    });
    logger.info(`Created shipping option "${SHIPPING_OPTION_NAME}" (£3.95 flat).`);
  } else {
    logger.info(`Shipping option "${SHIPPING_OPTION_NAME}" already exists.`);
  }

  logger.info("UK shipping seed complete.");
}
