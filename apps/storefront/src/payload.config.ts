import path from "path"
import { fileURLToPath } from "url"
import { buildConfig } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import sharp from "sharp"

import Users from "./collections/Users"
import Media from "./collections/Media"
import Pages from "./collections/Pages"
import ContactSubmissions from "./collections/ContactSubmissions"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000",
  secret: process.env.PAYLOAD_SECRET || "",
  admin: {
    user: Users.slug,
  },
  // Explicit, though "/admin" is also Payload's own default — kept
  // separate from Medusa's admin, which lives on the backend app under
  // /app, not this app at all.
  routes: {
    admin: "/admin",
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Pages, ContactSubmissions],
  // Powers Media's imageSizes (src/collections/Media.ts) — required
  // explicitly here, not picked up just by being installed. The cast works
  // around a type-only mismatch between sharp's own declaration file and
  // Payload's simplified SharpDependency type — same underlying function.
  sharp: sharp as unknown as Parameters<typeof buildConfig>[0]["sharp"],
  // Same Postgres instance Medusa uses (see apps/backend's DATABASE_URL) —
  // a distinct schema, not a distinct database, keeps this to one Postgres
  // instance to operate while still giving Payload's tables (which don't
  // share any naming convention with Medusa's) their own namespace.
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URI,
    },
    schemaName: "payload",
  }),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})
