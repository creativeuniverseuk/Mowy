import { MetadataRoute } from "next"
import { getPayload } from "payload"
import config from "@payload-config"

import { getBaseURL } from "@lib/util/env"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"

export const revalidate = 3600

async function getAllProductHandles(countryCode: string) {
  const handles: { handle: string; updated_at: string }[] = []
  const limit = 100
  let offset = 0

  while (true) {
    const { response } = await listProducts({
      countryCode,
      queryParams: { limit, offset, fields: "handle,updated_at" },
    })

    for (const product of response.products) {
      if (product.handle) {
        handles.push({
          handle: product.handle,
          updated_at: product.updated_at ?? new Date().toISOString(),
        })
      }
    }

    if (
      response.products.length < limit ||
      handles.length >= response.count
    ) {
      break
    }
    offset += limit
  }

  return handles
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseURL()

  const [regions, categories, payload] = await Promise.all([
    listRegions(),
    listCategories(),
    getPayload({ config }),
  ])

  const countryCodes = Array.from(
    new Set(
      (regions ?? [])
        .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
        .filter((c): c is string => Boolean(c))
    )
  )

  if (countryCodes.length === 0) {
    countryCodes.push(process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb")
  }

  // No `draft` param — for a drafts-enabled collection this returns only
  // published documents (see the getPage() comment in [slug]/page.tsx).
  const { docs: pages } = await payload.find({
    collection: "pages",
    limit: 1000,
    depth: 0,
  })

  const entries: MetadataRoute.Sitemap = []

  for (const countryCode of countryCodes) {
    entries.push({
      url: `${baseUrl}/${countryCode}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    })

    const productHandles = await getAllProductHandles(countryCode)
    for (const { handle, updated_at } of productHandles) {
      entries.push({
        url: `${baseUrl}/${countryCode}/products/${handle}`,
        lastModified: new Date(updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }

    for (const category of categories ?? []) {
      if (!category.handle) continue
      entries.push({
        url: `${baseUrl}/${countryCode}/categories/${category.handle}`,
        lastModified: category.updated_at
          ? new Date(category.updated_at)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const page of pages) {
      if (!page.slug) continue
      entries.push({
        url: `${baseUrl}/${countryCode}/${page.slug}`,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      })
    }
  }

  return entries
}
