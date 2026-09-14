import { search } from "@medusajs/framework/utils";
import type { SearchTypes } from "@medusajs/framework/types";
import {
  defineProductSearchIndex,
  productSearchSchema,
  createDefaultTransform,
  PRODUCT_GRAPH_FIELDS,
  type SearchDocumentTransform,
} from "@rokmohar/medusa-plugin-meilisearch/indexes";

// The product <-> card_detail link (see src/links/product-card-detail.ts)
// exposes these as `card_detail.*` in query.graph.
const CARD_DETAIL_GRAPH_FIELDS = [
  "card_detail.card_set",
  "card_detail.rarity",
  "card_detail.condition",
];

const GRAPH_FIELDS = [...PRODUCT_GRAPH_FIELDS, ...CARD_DETAIL_GRAPH_FIELDS];

// Starts from the plugin's own default projection (everything declared in
// GRAPH_FIELDS, nested as fetched) so title/description/handle/etc. behave
// exactly as they would without this override, then flattens the linked
// card_detail record and variant SKUs onto top-level fields.
const projectDefaults = createDefaultTransform(GRAPH_FIELDS);

const transformWithCardDetail: SearchDocumentTransform = (entity, context) => {
  const document = projectDefaults(entity, context) as Record<string, unknown>;
  delete document.card_detail;

  const cardDetail = entity.card_detail as
    | { card_set?: string; rarity?: string; condition?: string }
    | undefined;
  const variants = entity.variants as { sku?: string | null }[] | undefined;

  return {
    ...document,
    id: document.id as string,
    card_set: cardDetail?.card_set ?? null,
    rarity: cardDetail?.rarity ?? null,
    condition: cardDetail?.condition ?? null,
    variant_sku:
      variants
        ?.map((variant) => variant.sku)
        .filter((sku): sku is string => Boolean(sku))
        .join(" ") || null,
  } satisfies SearchTypes.SearchDocument;
};

const base = productSearchSchema();

export default defineProductSearchIndex({
  graph_fields: CARD_DETAIL_GRAPH_FIELDS,
  transform: transformWithCardDetail,
  fields: search.define({
    ...base,
    // Hide everything not in our displayedAttributes list; id/title/handle
    // stay retrievable by default (unset === retrievable).
    subtitle: base.subtitle.retrievable(false),
    description: base.description.retrievable(false),
    status: base.status.retrievable(false),
    is_giftcard: base.is_giftcard.retrievable(false),
    discountable: base.discountable.retrievable(false),
    collection_id: base.collection_id.retrievable(false),
    type_id: base.type_id.retrievable(false),
    // Marking the parent object non-retrievable doesn't cascade to its
    // nested paths in Meilisearch's displayedAttributes, so each leaf below
    // is redeclared with its own .retrievable(false) too (kept otherwise
    // identical to productSearchSchema()'s originals — same searchable/
    // filterable/facetable behavior, just hidden from results).
    collection: search
      .object({
        id: search.keyword().filterable().retrievable(false),
        title: search.text().searchable().facetable().retrievable(false),
        handle: search.keyword().filterable().retrievable(false),
      })
      .retrievable(false),
    type: search
      .object({
        id: search.keyword().filterable().retrievable(false),
        value: search.keyword().filterable().facetable().retrievable(false),
      })
      .retrievable(false),
    categories: search
      .object({
        id: search.keyword().filterable().facetable().retrievable(false),
        name: search.text().searchable({ weight: 2 }).facetable().retrievable(false),
        handle: search.keyword().filterable().retrievable(false),
      })
      .array()
      .retrievable(false),
    tags: search
      .object({
        id: search.keyword().filterable().retrievable(false),
        value: search.text().searchable().facetable().retrievable(false),
      })
      .array()
      .retrievable(false),
    variants: search
      .object({
        id: search.keyword().filterable().retrievable(false),
        title: search.text().searchable({ weight: 2 }).retrievable(false),
        sku: search.text().searchable({ weight: 4 }).filterable().retrievable(false),
        barcode: search.keyword().filterable().retrievable(false),
      })
      .array()
      .retrievable(false),
    created_at: base.created_at.retrievable(false),
    updated_at: base.updated_at.retrievable(false),
    // searchableAttributes order: title, description, card_set, rarity,
    // condition, variant_sku (Meilisearch has no per-field weights — this
    // plugin turns declared weight into that ordering).
    card_set: search.keyword().searchable({ weight: 2 }).filterable().facetable(),
    rarity: search.keyword().searchable({ weight: 1.5 }).filterable().facetable(),
    condition: search.keyword().searchable({ weight: 1.2 }).filterable().facetable(),
    variant_sku: search.text().searchable({ weight: 1 }).filterable().retrievable(false),
  }),
});
