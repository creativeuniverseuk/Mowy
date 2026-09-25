import Image from "next/image"

import { listCategories } from "@lib/data/categories"
import { getSiteSettings } from "@lib/data/site-settings"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SHOP_ORDER = [
  "Pokémon TCG",
  "3D-Printed Figures",
  "Lorcana",
  "Riftbound",
  "Cyberpunk",
  "Palworld",
  "Cataclysm: Arcade",
  "Mystery Pulls",
]

// CLAUDE.md's business details — the fallback until the admin's Site
// settings page (src/admin/routes/settings/site) has been filled in. A
// freshly migrated site_settings row is all nulls, and the footer's contact
// details shouldn't go blank just because nobody has visited that page yet.
const DEFAULT_ADDRESS_LINES = ["Abingdon Street Market", "Edward St, Blackpool FY1 1DR"]
const DEFAULT_PHONE = "+44 7427 255704"
const DEFAULT_EMAIL = "Snorlaxandmowytcg@gmail.com"

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
}

/**
 * Receipt-style site footer — monospace, dashed divider, torn-edge top
 * (matches the .foot-grid/.foot-bottom structure and dashed divider in
 * design-reference/mowy-homepage.html; the perforated top edge is not in
 * that mockup and is a from-scratch CSS mask/gradient addition).
 */
export default async function Footer() {
  const [allCategories, siteSettings] = await Promise.all([
    listCategories(),
    getSiteSettings(),
  ])
  const topLevel = allCategories.filter((c) => !c.parent_category)
  const shopLinks = SHOP_ORDER.map((name) =>
    topLevel.find((c) => c.name === name)
  ).filter((c): c is HttpTypes.StoreProductCategory => Boolean(c))

  const addressLines = siteSettings.address
    ? siteSettings.address.split("\n").filter(Boolean)
    : DEFAULT_ADDRESS_LINES
  const phone = siteSettings.contact_phone || DEFAULT_PHONE
  const email = siteSettings.contact_email || DEFAULT_EMAIL
  const socialLinks = Object.entries(siteSettings.social_links ?? {}).filter(
    ([, url]) => Boolean(url)
  )

  return (
    <footer className="bg-ink">
      <div
        aria-hidden
        className="h-2.5 w-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10px 0, transparent 10px, #1a1a24 11px)",
          backgroundSize: "20px 10px",
          backgroundRepeat: "repeat-x",
        }}
      />

      <div className="bg-ink-2 pb-8 pt-14">
        <div className="content-container">
          <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
            <div>
              <Image
                src="/mowy-logo-full.png"
                alt="MOWY — Play, Protect, Collect"
                width={800}
                height={639}
                className="h-20 w-auto object-contain"
              />
              <p className="mt-3.5 max-w-[280px] text-sm leading-[1.6] text-chrome-dim">
                Family-run trading card and collectibles shop, based at
                Abingdon Street Market, Blackpool.
              </p>
              {socialLinks.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                  {socialLinks.map(([platform, url]) => (
                    <li key={platform}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-chrome-dim transition-colors hover:text-chrome"
                      >
                        {SOCIAL_LABELS[platform] ?? platform}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-cobalt-soft">
                Shop
              </h3>
              <ul className="flex flex-col gap-2.5">
                {shopLinks.map((category) => (
                  <li key={category.id}>
                    <LocalizedClientLink
                      href={`/categories/${category.handle}`}
                      className="text-sm text-chrome-dim transition-colors hover:text-chrome"
                    >
                      {category.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-cobalt-soft">
                Support
              </h3>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <LocalizedClientLink
                    href="/account/orders"
                    className="text-sm text-chrome-dim transition-colors hover:text-chrome"
                  >
                    Track my order
                  </LocalizedClientLink>
                </li>
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-chrome-dim transition-colors hover:text-chrome"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-cobalt-soft">
                Visit / Contact
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm text-chrome-dim">
                {addressLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
                <li>
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="transition-colors hover:text-chrome"
                  >
                    {phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="transition-colors hover:text-chrome"
                  >
                    {email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-6 font-mono text-[11.5px] text-chrome-dim">
            <span>&copy; {new Date().getFullYear()} MOWY. ALL RIGHTS RESERVED.</span>
            <span>PLAY &middot; PROTECT &middot; COLLECT</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
