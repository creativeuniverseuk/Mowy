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

## Status

Repo initialised with documentation only. No app code scaffolded yet.
