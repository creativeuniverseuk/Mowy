import { Suspense } from "react"
import Image from "next/image"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { getSiteSettings } from "@lib/data/site-settings"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale, siteSettings] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    getSiteSettings(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-[72px] mx-auto border-b duration-200 bg-ink/95 backdrop-blur-sm border-line">
        <nav className="content-container flex items-center justify-between w-full h-full font-mono text-mono-sku uppercase tracking-[0.08em] text-chrome-dim">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center transition-opacity hover:opacity-80"
              data-testid="nav-store-link"
            >
              {siteSettings.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={siteSettings.logo_url}
                  alt="MOWY"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <Image
                  src="/mowy-logo-header.png"
                  alt="MOWY"
                  width={800}
                  height={567}
                  priority
                  className="h-14 w-auto object-contain"
                />
              )}
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="transition-colors hover:text-cobalt-soft"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="flex gap-2 transition-colors hover:text-cobalt-soft"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Bag (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
