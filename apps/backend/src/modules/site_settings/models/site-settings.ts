import { model } from "@medusajs/framework/utils"

// Single-row settings table — always read/written by id (see
// src/api/admin/site-settings/route.ts), never listed or filtered. There's
// no schema-level constraint enforcing exactly one row; the API route is
// what guarantees it by always reusing the first row it finds instead of
// creating a second one.
const SiteSettings = model.define("site_settings", {
  id: model.id().primaryKey(),
  logo_url: model.text().nullable(),
  contact_email: model.text().nullable(),
  contact_phone: model.text().nullable(),
  address: model.text().nullable(),
  social_links: model.json().nullable(),
  accent_color: model.text().nullable(),
  homepage_banner_text: model.text().nullable(),
})

export default SiteSettings
