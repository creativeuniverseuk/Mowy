import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="flex flex-col items-start justify-center px-2 py-32"
      data-testid="empty-cart-message"
    >
      <span className="font-mono text-mono-sku uppercase tracking-[0.14em] text-chrome-dim">
        MOWY &middot; Trading Cards
      </span>
      <h1 className="mt-1 font-headline text-h1 text-chrome">
        Your bag is empty
      </h1>
      <p className="mb-6 mt-4 max-w-[32rem] text-body text-chrome-dim">
        You don&apos;t have anything in your cart yet. Use the link below to
        start browsing our products.
      </p>
      <LocalizedClientLink
        href="/store"
        className="group flex items-center gap-1 font-mono text-mono-sku uppercase tracking-[0.08em] text-cobalt-soft hover:text-cobalt"
      >
        Explore products
        <span className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
