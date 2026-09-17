import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-ink small:min-h-screen">
      <div className="h-16 border-b border-line">
        <nav className="content-container flex h-full items-center justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex flex-1 basis-0 items-center gap-x-2 font-mono text-mono-sku uppercase tracking-[0.08em] text-chrome-dim hover:text-chrome"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block">Back to your bag</span>
            <span className="mt-px block small:hidden">Back</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="font-headline text-h4 uppercase tracking-[0.04em] text-chrome"
            data-testid="store-link"
          >
            MOWY
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="flex w-full items-center justify-center py-6">
        <span className="font-mono text-mono-sku uppercase tracking-[0.1em] text-chrome-dim">
          Secure checkout &middot; Payments handled by SumUp
        </span>
      </div>
    </div>
  )
}
