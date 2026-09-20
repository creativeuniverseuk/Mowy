import type { CollectionConfig } from "payload"

// Payload's own CMS editors, entirely separate from Medusa's admin users
// and from storefront customer accounts — this is the login for /admin.
const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [],
}

export default Users
