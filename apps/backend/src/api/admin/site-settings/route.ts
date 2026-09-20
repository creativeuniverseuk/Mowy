import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { SITE_SETTINGS_MODULE } from "../../../modules/site_settings";
import SiteSettingsModuleService from "../../../modules/site_settings/service";

type SiteSettingsBody = {
  logo_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  social_links?: Record<string, string> | null;
  accent_color?: string | null;
  homepage_banner_text?: string | null;
};

/**
 * There is exactly one settings row, but the module has no schema-level way
 * to enforce that — this is what does: always reuse the first row found
 * (ordering is irrelevant, there's only ever one), creating it lazily on
 * first read/write rather than seeding it via a migration or script.
 */
async function getOrCreateSettings(service: SiteSettingsModuleService) {
  const [existing] = await service.listSiteSettings({}, { take: 1 });
  if (existing) {
    return existing;
  }

  return service.createSiteSettings({});
}

/**
 * Same fetch-to-/api/revalidate pattern as
 * src/subscribers/product-changed.ts, but called directly rather than via
 * an emitted event — MedusaService's generated updateSiteSettings doesn't
 * emit a domain event by itself the way core modules do, so a subscriber
 * would have nothing to listen for here.
 */
async function revalidateStorefront(req: MedusaRequest) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  const storefrontUrl = process.env.STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!storefrontUrl || !secret) {
    logger.warn(
      "site-settings route: STOREFRONT_URL or REVALIDATE_SECRET not set, skipping storefront revalidation."
    );
    return;
  }

  const url = `${storefrontUrl.replace(/\/$/, "")}/api/revalidate?secret=${encodeURIComponent(
    secret
  )}&tags=site-settings`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn(
        `site-settings route: storefront revalidation returned ${response.status}.`
      );
    }
  } catch (error) {
    logger.warn(
      `site-settings route: failed to reach storefront revalidation endpoint — ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService = req.scope.resolve(
    SITE_SETTINGS_MODULE
  );

  const settings = await getOrCreateSettings(service);
  res.json({ site_settings: settings });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService = req.scope.resolve(
    SITE_SETTINGS_MODULE
  );
  const body = req.body as SiteSettingsBody;

  const existing = await getOrCreateSettings(service);
  // `undefined` (field omitted) keeps the existing value; `null` or any
  // other provided value — including an empty string — overwrites it. Using
  // `??` here would also treat an explicit `null` as "keep existing",
  // making it impossible to clear a field once set.
  const field = <T>(value: T | undefined, current: T) =>
    value === undefined ? current : value;

  const updated = await service.updateSiteSettings({
    id: existing.id,
    logo_url: field(body.logo_url, existing.logo_url),
    contact_email: field(body.contact_email, existing.contact_email),
    contact_phone: field(body.contact_phone, existing.contact_phone),
    address: field(body.address, existing.address),
    social_links: field(body.social_links, existing.social_links),
    accent_color: field(body.accent_color, existing.accent_color),
    homepage_banner_text: field(
      body.homepage_banner_text,
      existing.homepage_banner_text
    ),
  });

  await revalidateStorefront(req);

  res.json({ site_settings: updated });
}
