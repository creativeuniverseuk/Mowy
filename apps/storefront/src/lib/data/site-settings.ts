import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type SiteSettings = {
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  social_links: Record<string, string> | null
  accent_color: string | null
  homepage_banner_text: string | null
}

const EMPTY_SETTINGS: SiteSettings = {
  logo_url: null,
  contact_email: null,
  contact_phone: null,
  address: null,
  social_links: null,
  accent_color: null,
  homepage_banner_text: null,
}

/**
 * Cached with tag "site-settings" (see apps/backend's
 * src/api/admin/site-settings/route.ts, which revalidates this tag on
 * save — same fetch-to-/api/revalidate pattern as
 * src/subscribers/product-changed.ts). Falls back to empty settings on
 * failure rather than throwing, since a down settings fetch shouldn't take
 * out the footer or homepage banner it feeds.
 */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const next = { ...(await getCacheOptions("site-settings")) }

  try {
    const { site_settings } = await sdk.client.fetch<{
      site_settings: SiteSettings
    }>("/store/site-settings", {
      method: "GET",
      next,
      cache: "force-cache",
    })

    return site_settings ?? EMPTY_SETTINGS
  } catch {
    return EMPTY_SETTINGS
  }
}
