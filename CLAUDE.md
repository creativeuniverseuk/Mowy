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

- **`cobalt` (#3b6eff) fails WCAG AA as a solid button fill under `chrome`
  (#e8e9ee) text — measured 3.56:1 against the 4.5:1 minimum.** This isn't
  borderline: it only looked acceptable because it's the same treatment on
  every CTA site-wide, but none of those buttons' labels are large/bold
  enough to qualify for the lower 3:1 large-text threshold (WCAG's exception
  needs 18pt/24px normal weight, or 14pt/18.66px at ~700 weight — these are
  14px at `font-medium`/500). The previous `hover:bg-cobalt-soft` (and the
  `hover:bg-cobalt/90` variant used on the product-detail add-to-cart
  button) made it worse, not better: `cobalt-soft` is lighter, so hovering
  actually drops contrast to ~2.38:1.
  Fixed with a new token, `cobalt-deep` (`#345fd1`, `src/design-tokens.js`)
  — ~4.68:1 against `chrome`, for solid CTA-button fills only. Hover uses
  `hover:bg-cobalt-deep/90` (alpha blend toward the dark page/panel behind
  it, which only deepens the colour further in this design system since
  every surface token is dark — verified ~5.3:1). `cobalt`/`cobalt-soft`
  are unchanged and still correct for links, borders, and focus rings,
  which are judged against the 3:1 non-text/UI-component threshold, not
  4.5:1 — don't use `cobalt-deep` there, it reads too dark for those.

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
  are introduced. **Must be named exactly `.env.example`** — the root
  `.gitignore`'s `.env.*` rule blanket-ignores everything starting with
  `.env`, with a single carve-out for `!.env.example`. `apps/storefront`
  shipped from its starter template with `.env.template` instead, which
  silently was never tracked (confirmed: `git log --all` for that path
  returns nothing, from the very first commit onward) — every var anyone
  documented there across earlier phases existed only on that person's
  disk. Renamed to `.env.example` and committed for real; if a documented
  var seems to have "gone missing" for a teammate, check `git show
  HEAD:<path>` on the actual file before assuming it's a gitignore
  oversight elsewhere.
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

- **CRITICAL — `query.graph` unreliably resolves order line item metadata,
  and this briefly created a real (never-triggered) double-assignment /
  double-decrement exposure.** Confirmed by direct, repeated, side-by-side
  testing, not inferred: querying the same order's line item metadata twice
  in the same process, moments apart, sometimes returned the real,
  already-written data and sometimes returned empty — for *either* of the
  two differently-named fields the order aggregate exposes (`items.metadata`,
  documented in `@medusajs/types` as "the *versioned* order item metadata"
  and never written by this app; `items.line_item_metadata`, documented as
  "the metadata of the line item", the field `updateOrderLineItems()`
  actually writes to) — independent of which field name was queried and
  independent of how long ago the write had happened. Raw SQL against
  `order_line_item` via the driver's own `PG_CONNECTION` was correct in
  every single test, with no exceptions. Root mechanism not fully
  identified (this project's Postgres is a pooled Neon connection, and
  `query.graph` goes through a separate MikroORM-managed connection/cache
  than the driver's own `PG_CONNECTION`) — not needed to be, since the fix
  doesn't depend on understanding it.

  This mattered because both `src/subscribers/mystery-pull-assign-on-capture.ts`
  and `src/jobs/reconcile-mystery-pull-assignments.ts` used exactly this
  unreliable read for their "has this line item already been assigned an
  outcome" guard — and neither `assignOutcomeStep` nor
  `decrementInventoryForOutcomeStep` (`src/workflows/mystery-pull/`) had any
  independent protection against reprocessing the same line item. If that
  guard ever saw stale "not assigned" data for a line item that genuinely
  already had a result, the only thing standing between that and drawing a
  second outcome — and decrementing real, scarce inventory a second time for
  a card already given away — was that one unreliable read. Checked for
  actual damage directly: outcome `remaining_qty` and `updated_at`
  timestamps matched exactly the count of legitimate draws, with no extra
  decrements anywhere — so this was never actually triggered in practice.
  But the exposure was real, not hypothetical, for a feature whose entire
  job is handing out one real, unique physical card per real payment — the
  same class of severity as the SumUp amount bug below, for the same reason
  (real money/goods riding on something that turned out to be unreliable).

  **Fix — not a more careful read, a hard constraint.** Added
  `pull_assignment` (`src/modules/mystery_pull/models/pull-assignment.ts`),
  a table with a unique index on `line_item_id`. `assignOutcomeStep` now
  inserts into it inside the *same* locked transaction that picks the
  outcome and decrements `remaining_qty`, so a second assignment attempt for
  an already-assigned line item hits a Postgres unique-violation and the
  whole transaction — including the decrement — rolls back, regardless of
  what any read anywhere returned. Verified directly, twice over: a second
  assignment attempt for the same `line_item_id`, both through the real
  workflow and via a raw SQL `INSERT` that bypasses all application code
  entirely, were both rejected by Postgres itself with error `23505`
  (`unique_violation`) on `IDX_pull_assignment_line_item_id_unique` — the
  database enforcing it, not an application-level check — and
  `remaining_qty` was confirmed unchanged by the rejected attempt in both
  cases. As defense in depth (not the actual guarantee — the DB constraint
  is), all three places that need to know "is this line item assigned" (the
  result API route, the subscriber, the reconciliation job) were also
  switched from `query.graph` to a shared direct-SQL helper,
  `src/workflows/mystery-pull/line-item-metadata.ts` — reliable in every
  test run, including immediately after a write.

## Payload CMS

Embedded in `apps/storefront` (`src/payload.config.ts`), self-hosted (no
Payload Cloud), Postgres adapter pointed at the same Neon instance Medusa
uses but with `schemaName: "payload"` — a separate schema, not a separate
database, so one Postgres instance still covers everything.

- **`src/app` has two top-level route groups, each with its own root
  layout, and nothing outside a route group.** `(storefront)` holds
  everything that existed before Payload — `[countryCode]`, `api`,
  `checkout`, `not-found.tsx`, `design-tokens`, the OG images — with the
  original root `layout.tsx` moved in unchanged. `(payload)` holds the
  admin panel (`admin/[[...segments]]`) and Payload's own REST/GraphQL
  routes (`api/[...slug]`, `api/graphql`, `api/graphql-playground`), using
  `@payloadcms/next`'s `RootLayout`, which renders its own `<html>`/`<body>`.
  This is Next.js's documented "multiple root layouts" pattern — it's the
  only way to get two independent `<html>` roots in one App Router tree,
  and it's why there's no `layout.tsx` directly in `src/app` any more.
  Anything genuinely new at the top level needs its own route group, not a
  bare folder in `src/app`.
- `src/middleware.ts`'s matcher excludes `admin` (alongside the
  pre-existing `api`/`design-tokens`/etc. exclusions) — without that, every
  request to `/admin` first runs the storefront's Medusa-region-detection
  middleware and 500s if the Medusa backend happens to be down. Payload's
  admin has nothing to do with Medusa regions and must work independently
  of it.
- **`admin/importMap.js` must be the real output of Payload's own
  generator, not a hand-written stand-in** — even a config with zero custom
  `admin.components` still needs entries for the field/dashboard components
  the built-in field types and lexical editor features resolve through
  (confirmed directly: a hand-written empty `importMap.js` compiles and
  serves `/admin`, but the dashboard body renders completely blank with a
  console error — `getFromImportMap: PayloadComponent not found in
  importMap` — the moment any of those resolve). Regenerate it (see the CLI
  gotcha below) any time a collection, block, or field's admin config
  changes shape.
- **CRITICAL — the Payload CLI (`payload generate:types`,
  `generate:importmap`, `run <script>`) does not work on this project's
  Node version (v26.9.0) as of Payload 3.90.1, confirmed by direct testing,
  not inferred.** Every code path the CLI's `bin.js` can take —
  `tsx` (default), `tsx` with `--no-require-module`, and `--use-swc` — was
  tried directly and each hits a different Node v26-specific crash before
  ever reaching this project's own config:
  - Default: `ERR_REQUIRE_ASYNC_MODULE` requiring `@payloadcms/richtext-lexical` (its ESM has top-level await).
  - `--no-require-module`: reverts to the older `ERR_REQUIRE_ESM` requiring `payload`'s own ESM build.
  - `--use-swc`: `ERR_REQUIRE_CYCLE_MODULE` on `src/collections/Users.ts`, a file with no cycle in it.
  - Bumping `tsx` to the latest (4.23.15) via a pnpm override fixes the
    first crash but uncovers a fourth: `undici`'s own `index.js`
    unconditionally does `new CacheStorage()` at module-load time, which
    throws "Illegal constructor" against Node v26's own native
    `CacheStorage` global — reproduced identically on undici 7.29.0 (what
    Payload ships) and the latest 8.10.2, so it isn't an undici-version fix
    either.

  Root cause, as far as this was narrowed: `tsx`'s CJS-from-ESM interop
  (needed because `payload.config.ts` must be loaded as CommonJS for the
  CLI) fights Node v26's evolving synchronous `require(esm)` semantics —
  four distinct failure modes across two loader strategies point at the
  interop layer, not at this project's config (Medusa's own CLI, on the
  same Node version, in the same repo, hits none of this — the exposure is
  specific to how Payload's CLI loads TypeScript, not to Node v26 broadly).

  **Working around it — bypass `tsx` and the CLI's own loader entirely,
  land in real native ESM before any Payload code runs:**
  1. Bundle `payload.config.ts` alone with esbuild, `--packages=external`
     so only this project's own relative imports (collections, blocks) get
     resolved into one file — Payload's own packages stay untouched,
     bare-specifier imports, resolved normally by Node:
     ```
     npx esbuild src/payload.config.ts --bundle --platform=node --format=esm \
       --outfile=/tmp/payload.config.bundled.mjs --packages=external
     ```
  2. Import that bundled file from a plain `.mts`/`.mjs` script that calls
     whatever the CLI would have (all confirmed working this way):
     `generateImportMap` (`payload/dist/bin/generateImportMap/index.js`),
     `generateTypes` (`payload/dist/bin/generateTypes.js`), or, for a
     one-off script, `getPayload({ config })` directly (see
     `src/scripts/seed-about-page.ts`). These are deep imports into
     `payload`'s `dist/`, not public exports — reach them with a relative
     file path from your script (not a bare `payload/...` specifier), which
     sidesteps the package's `exports` map restriction.
  3. Run with plain `node` (no flags needed) — real ESM `import` handles
     top-level await and CJS/ESM interop correctly on its own; this is
     exactly what `tsx`'s synthetic CJS shim was getting wrong.
  4. **Watch `typescript.outputFile`'s path resolution in `payload.config.ts`
     if it's computed from `import.meta.url`/`dirname`** — that resolves
     relative to wherever the *bundle* physically sits (esbuild's
     `--outfile`), not the real `src/payload.config.ts`, since bundling
     rewrites `import.meta.url` for the merged file. Move the generated
     file to the intended path afterward, or generate into the bundle's own
     directory in the first place.

  Package.json's `payload`, `generate:types`, `generate:importmap`, and
  `seed:pages` scripts still call the real CLI (`payload generate:types`,
  etc.) as the intended, ecosystem-standard interface — they'll start
  working the day `tsx` (or Node) closes this gap. Until then, use the
  bundle-and-native-node approach above instead of hand-rolling generated
  files or skipping codegen. This does **not** affect `next dev`/`next
  build`: Next's own SWC pipeline transpiles `payload.config.ts` and
  everything under `(payload)` without going through `tsx` at all — the
  admin panel, live preview, and the Postgres-backed collections all run
  normally in the actual dev server. Only the standalone CLI is affected.
- **`sharp` must be imported and passed into `buildConfig({ sharp })`
  explicitly** (`src/payload.config.ts`) — installing it isn't enough,
  Media's `imageSizes` (`src/collections/Media.ts`) silently skips resizing
  without this and Payload logs a warning on boot. The `sharp` import's
  default export needs a cast (`as unknown as Parameters<typeof
  buildConfig>[0]["sharp"]`) — a type-only mismatch between `sharp`'s own
  declaration file and Payload's simplified `SharpDependency` type, not a
  behavioural difference.

### Rendering Pages on the public site

- **`app/[slug]/page.tsx` lives at
  `src/app/(storefront)/[countryCode]/(main)/[slug]/page.tsx`, not at the
  storefront's true root**, despite what a literal reading of "top-level
  `[slug]` route" would suggest. Nav and Footer (rendered by the `(main)`
  layout every other storefront route already goes through) both use
  `LocalizedClientLink`, which reads `countryCode` from `useParams()` — a
  CMS page rendered outside the `[countryCode]` segment would get a working
  page but a broken header/footer (links resolving to `/undefined/...`).
  Nesting under `[countryCode]/(main)` costs nothing (Payload Pages don't
  need Medusa region data themselves) and keeps the site chrome intact.
  `Pages.ts`'s `livePreview.url` and the `/next/preview` redirect target
  both point at this same location.
- **Live preview needs two separate pieces working together, not just
  draft mode** — confirmed by testing each in isolation. Draft mode +
  `payload.find({ draft: true })` alone (what `[slug]/page.tsx` does)
  is enough for the preview iframe to show unsaved changes *the first time
  it loads*, but edits made after that point sit invisible until something
  tells the iframe to re-fetch — typing in the admin does **not**
  automatically update it on its own. The second piece is
  `@payloadcms/live-preview-react`'s `RefreshRouteOnSave` (used in
  `src/modules/pages/live-preview-listener.tsx`, rendered only when
  `draftMode().isEnabled`): it listens for the postMessage Payload's admin
  sends on every form change and calls `router.refresh()`, which re-runs
  the page's server component (the same `draft: true` fetch) so the
  iframe reflects each edit within about a second, autosave-limited (the
  800ms interval in `Pages.ts`'s `versions.drafts.autosave`) rather than
  truly keystroke-by-keystroke. `useLivePreview` (the other hook this
  package exports) is a different, heavier approach — it holds page data
  entirely client-side, merged from postMessage payloads with no server
  round-trip — and would need the whole block-rendering tree restructured
  around it; not used here, since `RefreshRouteOnSave` reuses the existing
  server-component fetch as-is.
- **Pages' SEO fields are a hand-rolled `meta` group** (`title`,
  `description`, `image`) — no `@payloadcms/plugin-seo`. `generateMetadata`
  in `[slug]/page.tsx` falls back to the page's own `title` when
  `meta.title` is empty.

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

## Admin gotchas

- **Every new product needs a price set explicitly, as its own step.** In the
  admin: Variants → "…" menu → **Edit prices**. It is separate from the main
  product form, so creating and publishing a product without it succeeds
  silently, and it is easy to miss on a Mystery Pull product where attention
  is on the pool and outcomes setup. Symptom: the storefront shows "Price on
  request" and "Buy and open a pull" appears to do nothing — the cart's
  line-item call fails with a 400 (`Variants with IDs … do not have a
  price`), which the click handler currently swallows. Check the price first
  when a new product's buy button seems dead.
- A Mystery Pull *pack* product should have a single default variant. Rarity
  belongs on the pool's outcomes (each linked to its own prize product), not
  on pack variants — the storefront buys `variants[0]`, so extra rarity
  variants make the purchased variant arbitrary.
- **Admin extension UI (`src/admin/routes/**`, `src/admin/widgets/**`) can only
  use Tailwind classes already present in the admin dashboard's precompiled
  CSS** (`@medusajs/dashboard`'s build) — there's no JIT compilation of
  extension source, so a class like `sm:grid-cols-2 xl:grid-cols-4` that isn't
  already used somewhere in core admin renders as nothing, silently, with no
  build error. Stick to classes you can find in use elsewhere in the admin, or
  fall back to inline `style` for anything bespoke (e.g. the dashboard's
  responsive stat-card grid uses `style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}`
  rather than a Tailwind responsive-grid utility). See
  `apps/backend/src/admin/routes/dashboard/page.tsx`.
- **Known gap, not a bug: Site settings' `accent_color` picker persists but
  does nothing yet.** It saves correctly end-to-end — admin form → the
  `site_settings` module's DB row → both `/admin/site-settings` and
  `/store/site-settings` — but no storefront component currently reads it.
  The site's brand cobalt (banner, nav, footer, buttons) stays a fixed
  Tailwind token throughout. Don't mistake a colour change with no visible
  effect for a broken save; it isn't wired to any UI yet. (Unrelated: the
  `accentColor` you'll find elsewhere in the storefront codebase is Mystery
  Pull's per-outcome `rarity_color` — a different field entirely, already
  live on the Mystery Pulls category page and pull-reveal screen.)
- **There is no admin widget zone for the sidebar's own header.** Verified
  directly against the installed `@medusajs/dashboard@2.21.0`'s injection
  zone registry (`@medusajs/admin-shared`'s `INJECTION_ZONES`) and its
  `Header` component: the top of the sidebar is a Store-name/avatar dropdown
  (reads `useStore()`, i.e. **Settings → Store → Name**), not a hardcoded
  "Medusa" logo, and it isn't exposed as an injection zone at all — no
  widget can touch it. The only zone in the authenticated shell is
  `"topbar"`, which renders inline with the notification bell in the main
  content header, not the sidebar. MOWY's admin branding
  (`src/admin/widgets/mowy-brand.tsx`) is therefore two separate fixes: the
  `topbar` zone widget (an actual hexagonal chrome-M/cobalt-chevron mark)
  for a visible logo, plus setting Store name to "MOWY" for the sidebar
  header itself, which was reading "Default Store" until this was set. If a
  future Medusa version adds a real sidebar-header zone, prefer it over this
  combination.

## Status

Repo initialised with documentation only. No app code scaffolded yet.
