import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getProductPullPool } from "@lib/data/mystery-pulls"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import MysteryPullPage from "@modules/mystery-pulls/templates/mystery-pull-page"
import ProductJsonLd from "@modules/products/components/product-jsonld"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return product.images!.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  const description =
    product.description || `${product.title} — available now at MOWY.`
  const canonicalPath = `/${params.countryCode}/products/${product.handle}`

  return {
    title: product.title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: product.title,
      description,
      url: canonicalPath,
      images: product.thumbnail ? [product.thumbnail] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  if (!pricedProduct) {
    notFound()
  }

  // A product linked to a pull_pool is a mystery-pull pack, not a regular
  // card — render the dedicated pack/odds/buy experience instead of the
  // standard product template. See CLAUDE.md's Mystery Pull module section.
  const pool = await getProductPullPool(pricedProduct.id)

  if (pool) {
    return (
      <MysteryPullPage
        product={pricedProduct}
        pool={pool}
        countryCode={params.countryCode}
      />
    )
  }

  return (
    <>
      <ProductJsonLd
        product={pricedProduct}
        countryCode={params.countryCode}
        selectedVariantId={selectedVariantId}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images}
      />
    </>
  )
}
