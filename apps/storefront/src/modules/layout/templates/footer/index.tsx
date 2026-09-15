import { listCategories } from "@lib/data/categories"
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

/**
 * Receipt-style site footer — monospace, dashed divider, torn-edge top
 * (matches the .foot-grid/.foot-bottom structure and dashed divider in
 * design-reference/mowy-homepage.html; the perforated top edge is not in
 * that mockup and is a from-scratch CSS mask/gradient addition).
 */
export default async function Footer() {
  const allCategories = await listCategories()
  const topLevel = allCategories.filter((c) => !c.parent_category)
  const shopLinks = SHOP_ORDER.map((name) =>
    topLevel.find((c) => c.name === name)
  ).filter((c): c is HttpTypes.StoreProductCategory => Boolean(c))

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
              <div className="flex items-baseline gap-2">
                <span className="text-h4 text-chrome">MOWY</span>
                <span className="font-mono text-[11px] text-cobalt-soft">
                  PLAY &middot; PROTECT &middot; COLLECT
                </span>
              </div>
              <p className="mt-3.5 max-w-[280px] text-sm leading-[1.6] text-chrome-dim">
                Family-run trading card and collectibles shop, based at
                Abingdon Street Market, Blackpool.
              </p>
            </div>

            <div>
              <h5 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-cobalt-soft">
                Shop
              </h5>
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
              <h5 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-cobalt-soft">
                Support
              </h5>
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
                    href="mailto:Snorlaxandmowytcg@gmail.com"
                    className="text-sm text-chrome-dim transition-colors hover:text-chrome"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-cobalt-soft">
                Visit / Contact
              </h5>
              <ul className="flex flex-col gap-2.5 text-sm text-chrome-dim">
                <li>Abingdon Street Market</li>
                <li>Edward St, Blackpool FY1 1DR</li>
                <li>
                  <a
                    href="tel:+447427255704"
                    className="transition-colors hover:text-chrome"
                  >
                    +44 7427 255704
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:Snorlaxandmowytcg@gmail.com"
                    className="transition-colors hover:text-chrome"
                  >
                    Snorlaxandmowytcg@gmail.com
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
