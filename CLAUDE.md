# MOWY

UK trading-card e-commerce site, rebranding from "Snorlax and Mowy TCG". Monorepo,
no app code scaffolded yet — this file documents the intended stack and conventions
before scaffolding begins.

## Business

- Trading name: MOWY
- Address: Abingdon Street Market, Edward St, Blackpool FY1 1DR
- Email: Snorlaxandmowytcg@gmail.com
- Phone: +44 7427 255704
- Currency: GBP · Region: gb

## Stack

- **Backend**: Medusa v2 — `apps/backend`
- **Storefront**: Next.js (App Router) + Tailwind + shadcn/ui + Framer Motion —
  `apps/storefront`
- **CMS**: Payload CMS, embedded inside the storefront app, used for Pages content
  only (not products/orders — that's Medusa's job)
- **Database**: PostgreSQL
- **Search**: Meilisearch
- **Payments**: SumUp Hosted Checkout
- **Hosting**: Railway (backend), Vercel (storefront)

Planned layout:

```
apps/
  backend/     # Medusa v2
  storefront/  # Next.js + Payload CMS
design-reference/
```

## Brand

### Identity

- Logo: hexagonal chrome "M" with a blue chevron
- Tagline: "PLAY · PROTECT · COLLECT"

### Colour tokens

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14141c` | background |
| `chrome` | `#e8e9ee` | text |
| `cobalt` | `#3b6eff` | accent / brand actions, links, focus states |
| `live` (green) | semantic | in-stock / live status |
| `low-stock` (amber) | semantic | low-stock status |
| `out-of-stock` (red) | semantic | out-of-stock status |

The three semantic status colours (green/amber/red) are for stock state only and must
stay visually distinct from `cobalt` — never reuse cobalt to mean stock status, and
never use green/amber/red for brand chrome or generic UI accents.

### Type

- **Headlines**: Space Grotesk
- **Body**: Inter
- **Price tags / SKUs**: JetBrains Mono

## Catalogue

### Top-level categories (confirmed)

1. Pokémon TCG
2. 3D-Printed Figures
3. Lorcana
4. Riftbound
5. Cyberpunk
6. Palworld
7. Cataclysm: Arcade
8. Mystery Pulls

### URL / slug convention

Products and categories use human-readable slugs, not auto-generated IDs.

- Product: `/products/charizard-ex-holo-tm-208`
- Category: `/categories/<category-slug>`

Slugs are lowercase, hyphen-separated, and derived from card/product name + notable
identifiers (set code, number) where needed for uniqueness — never a raw database ID
or UUID in a public URL.

## Conventions

- TypeScript everywhere (backend, storefront, CMS config, scripts)
- Next.js: server components by default; opt into `"use client"` only when the
  component needs interactivity, browser APIs, or hooks
- No secrets in code — all credentials/API keys via environment variables, never
  committed (see `.gitignore`); use `.env.example` to document required vars as they
  are introduced
- Commit incrementally and in scope — one logical change per commit, don't bundle
  unrelated work
- `/design-reference` contains static HTML/CSS/JS mockups for visual comparison only.
  Never import these files or copy their code directly into `apps/backend` or
  `apps/storefront` — re-implement to match, using the real stack's components and
  conventions

## Mystery Pull module

`apps/backend/src/modules/mystery_pull` (`pull_pool`, `pull_outcome`), linked to
Medusa's product module via `src/links/product-pull-pool.ts` (`pull_pool` <->
`product`) and `src/links/pull-outcome-product.ts` (`pull_outcome` <->
`product_variant`).

- Deleting a `pull_pool` or `pull_outcome` record (e.g. via
  `MysteryPullModuleService#deletePullPools` / `#deletePullOutcomes`) does
  **not** cascade-delete its product/variant link row. The module service's
  delete methods and the Link module are independent — nothing wires them
  together automatically. Call `link.dismiss()` for both sides explicitly
  before (or after) deleting the record, or the link row survives: soft-deleted
  (`deleted_at` set, same convention as everywhere else in Medusa) so it's
  invisible to `query.graph` and every normal read, but still present in the
  link table. See `apps/backend/src/scripts/verify-mystery-pull-links.ts` for
  the working pattern. Relevant for any future pool-deletion UI in the admin
  widget (Prompt 5B.6) — that flow needs to dismiss links itself, not just
  delete the pool/outcome record.

## Known upstream issues

- `apps/backend/patches/@tsc_tech__medusa-plugin-cloudinary.patch` — pnpm patch
  fixing a bug in `@tsc_tech/medusa-plugin-cloudinary@1.0.0`'s file-cloudinary
  provider: it decodes Medusa's uploaded file content with
  `Buffer.from(file.content, "binary")`, but Medusa sends that content
  base64-encoded, so the bytes get corrupted and Cloudinary miscategorizes every
  upload as `raw` instead of `image`. Not yet reported upstream. Safe to drop
  (and remove its entry from `pnpm-workspace.yaml`) once a fixed version ships.
- `apps/backend/patches/@sumup__medusa-plugin.patch` — pnpm patch fixing a
  payment-correctness bug in `@sumup/medusa-plugin@0.1.0`'s
  `toMajorUnitNumber()` helper, in `providers/sumup/utils.js`. This has been
  wrong in both directions across two rounds of fixes:
  - **Round 1**: the original code coerced Medusa's BigNumber-shaped amount
    to a plain number and returned it unchanged. Confirmed against SumUp's
    API that this sent an intended £11.00 charge as `amount: 1100` (a 100x
    *overcharge*). Fixed by dividing by the currency's decimal-digit factor.
  - **Round 2**: that division was itself wrong. Verified directly against a
    real Medusa v2.21 cart → checkout → SumUp flow (not a synthetic test): a
    real £645.00 cart was submitted to SumUp as £6.45 (a 100x
    *undercharge*), and a live refund attempt hit the same bug on that call
    site too. Root cause: `initiatePayment`/`updatePayment` receive a plain
    JS `number` already in **major units** (`645`, not `64500`) — see
    `@medusajs/payment`'s `PaymentModuleService#createPaymentSession` /
    `#updatePaymentSession`, which pass the payment collection's amount
    straight through — and `refundPayment` receives `refund.raw_amount`, a
    BigNumber-raw object (`{ value: "645", precision: 20 }`, where
    `precision` is significant-digit precision for arbitrary-precision math,
    not a scale factor — see `@medusajs/utils`'s `BigNumber` class). Both
    shapes represent the *same* major-unit decimal amount in this Medusa
    version; neither ever represents minor units (pence/cents). Fixed by
    extracting the numeric value from whichever shape arrives and no longer
    scaling it at all, with a guard that throws if the resulting amount is
    implausibly large for a retail transaction (over 50,000 in the
    currency's major units) — a backstop in case some future call path (or
    Medusa version) ever does hand this minor units again, which is exactly
    how Round 1's bug happened.

  Not yet reported upstream. Safe to drop (and remove its entry from
  `pnpm-workspace.yaml`) once a fixed version ships — but re-verify against
  a real cart → checkout → SumUp flow and a real refund first, the same way
  this fix was, rather than trusting the diff on inspection alone; this bug
  has now fooled a from-scratch reading of the code twice.

## Status

Repo initialised with documentation only. No app code scaffolded yet.
