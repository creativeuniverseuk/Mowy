import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { listRegions } from "@lib/data/regions"
import { CardFacetField, CARD_FACET_FIELDS, parseCsvParam } from "@lib/util/card-facets"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    card_set?: string
    rarity?: string
    condition?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const title = productCategory.name
    const description =
      productCategory.description || `Shop ${title} at MOWY.`
    const canonicalPath = `/${params.countryCode}/categories/${params.category.join("/")}`

    const { response } = await listProducts({
      countryCode: params.countryCode,
      queryParams: {
        category_id: [productCategory.id],
        limit: 1,
        fields: "thumbnail",
      },
    })
    const ogImage = response.products[0]?.thumbnail

    return {
      title,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        title,
        description,
        url: canonicalPath,
        images: ogImage ? [ogImage] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    }
  } catch (error) {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page, q, card_set, rarity, condition } = searchParams

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  const rawFacets: Record<CardFacetField, string | undefined> = {
    card_set,
    rarity,
    condition,
  }
  const facets = Object.fromEntries(
    CARD_FACET_FIELDS.map((field) => [field, parseCsvParam(rawFacets[field])])
  )

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      query={q}
      facets={facets}
      countryCode={params.countryCode}
    />
  )
}
