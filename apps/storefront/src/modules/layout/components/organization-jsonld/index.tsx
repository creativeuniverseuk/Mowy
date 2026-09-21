import { getSiteSettings } from "@lib/data/site-settings"
import { getBaseURL } from "@lib/util/env"
import { toJsonLdScript } from "@lib/util/json-ld"

// Same CLAUDE.md fallback convention as the footer
// (src/modules/layout/templates/footer) — used until Site settings (admin)
// has real values for the atomic fields (phone/email/logo).
const DEFAULT_PHONE = "+44 7427 255704"
const DEFAULT_EMAIL = "Snorlaxandmowytcg@gmail.com"

/**
 * Sitewide Organization + LocalBusiness JSON-LD, rendered once from the root
 * layout. The PostalAddress is always CLAUDE.md's fixed address rather than
 * Site settings' `address` field — that field is a single freeform text
 * block (see footer's DEFAULT_ADDRESS_LINES), not reliably splittable into
 * the discrete streetAddress/addressLocality/postalCode schema.org expects.
 */
export default async function OrganizationJsonLd() {
  const siteSettings = await getSiteSettings()
  const baseUrl = getBaseURL()

  const phone = siteSettings.contact_phone || DEFAULT_PHONE
  const email = siteSettings.contact_email || DEFAULT_EMAIL
  const logo = siteSettings.logo_url || `${baseUrl}/mowy-logo-full.png`

  const data = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": `${baseUrl}/#organization`,
    name: "MOWY",
    url: baseUrl,
    logo,
    image: logo,
    email,
    telephone: phone,
    slogan: "PLAY · PROTECT · COLLECT",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Abingdon Street Market, Edward St",
      addressLocality: "Blackpool",
      postalCode: "FY1 1DR",
      addressCountry: "GB",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLdScript(data) }}
    />
  )
}
