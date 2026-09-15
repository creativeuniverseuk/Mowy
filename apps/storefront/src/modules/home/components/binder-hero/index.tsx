import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BinderGrid from "./binder-grid"

/**
 * MOWY homepage hero — a tilted 3D "binder page" of 9 card sleeves.
 * Server component: fetches the featured products, hands them to the
 * client-side <BinderGrid /> for the 3D tilt / hover-sheen interaction.
 */
export default async function BinderHero({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 9,
      fields: "id,handle,title,thumbnail,+collection.title",
    },
  })

  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 700px 400px at 85% -10%, rgba(59,110,255,0.15), transparent 60%), radial-gradient(ellipse 600px 500px at 5% 20%, rgba(232,233,238,0.08), transparent 60%)",
        }}
      />

      <div className="content-container relative grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_560px] lg:gap-[60px]">
        <div>
          <div className="mb-5 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-cobalt-soft">
            <span className="h-px w-[22px] bg-cobalt-soft" />
            Family-run &middot; Blackpool, UK
          </div>

          <h1 className="mb-5 text-display text-chrome">
            Every card
            <br />
            tells its own{" "}
            <em
              className="bg-clip-text not-italic text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, #ffffff, #b9c2d0 45%, #3b6eff 85%)",
              }}
            >
              story.
            </em>
          </h1>

          <p className="mb-8 max-w-[460px] text-body-lg text-chrome-dim">
            Hand-checked Pokémon TCG, 3D-printed figures, and a growing shelf
            of Lorcana, Riftbound and beyond — sourced and sleeved by a
            family that still works the market stall.
          </p>

          <div className="mb-9 flex flex-wrap gap-3.5">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-2 rounded-[9px] bg-chrome px-6 py-3.5 text-sm font-semibold text-ink transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,110,255,0.25)]"
            >
              Shop new drops
            </LocalizedClientLink>
            <a
              href="#find-your-set"
              className="inline-flex items-center gap-2 rounded-[9px] border border-line px-6 py-3.5 text-sm font-semibold text-chrome transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:border-cobalt-soft"
            >
              Browse the binder
            </a>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-chrome-dim">
            <span>Hand-checked before it ships</span>
            <span>Tracked UK &amp; international shipping</span>
            <span>New stock every week</span>
          </div>
        </div>

        <BinderGrid products={products} />
      </div>
    </section>
  )
}
