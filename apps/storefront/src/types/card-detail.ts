import { HttpTypes } from "@medusajs/types"

/**
 * Shape of the `card_detail` module linked to a product (see
 * apps/backend/src/modules/card_detail and apps/backend/src/links/
 * product-card-detail.ts). Not part of @medusajs/types since it's a
 * project-specific module — resolved via `fields: "+card_detail.*"`.
 */
export type CardDetail = {
  id: string
  card_set: string
  rarity: string
  condition: string
  is_graded: boolean
  grading_company: string | null
  grade: number | null
}

export type ProductWithCardDetail = HttpTypes.StoreProduct & {
  card_detail?: CardDetail | null
}
