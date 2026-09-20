import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { SITE_SETTINGS_MODULE } from "../../../modules/site_settings";
import SiteSettingsModuleService from "../../../modules/site_settings/service";

/**
 * Read-only mirror of the admin route, for the storefront's homepage banner
 * and footer. Everything this module stores (logo, contact details, social
 * links, accent colour, banner text) is already meant to be public, so this
 * is unauthenticated like the rest of src/api/store.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: SiteSettingsModuleService = req.scope.resolve(
    SITE_SETTINGS_MODULE
  );

  const [settings] = await service.listSiteSettings({}, { take: 1 });

  res.json({
    site_settings: settings ?? {
      logo_url: null,
      contact_email: null,
      contact_phone: null,
      address: null,
      social_links: null,
      accent_color: null,
      homepage_banner_text: null,
    },
  });
}
