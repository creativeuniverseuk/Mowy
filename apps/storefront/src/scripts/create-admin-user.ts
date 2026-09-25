import { getPayload } from "payload"
import config from "../payload.config"

/**
 * DEV-ONLY RECOVERY TOOL — not app code, never imported by the storefront.
 *
 * Creates a Payload CMS admin user, or resets the password if a user with
 * that email already exists. For regaining access to /admin when a
 * password is lost. Goes through Payload's local API so the password is
 * hashed the same way the login flow expects — not a direct DB write.
 *
 * Requires both ADMIN_EMAIL and ADMIN_PASSWORD in the environment; neither
 * has a default.
 *
 * Run with the esbuild+node workaround documented in CLAUDE.md's Payload
 * CLI gotcha (the `payload run` CLI itself is broken on this project's
 * Node version).
 */
const EMAIL = process.env.ADMIN_EMAIL
const PASSWORD = process.env.ADMIN_PASSWORD

async function run() {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before running this script."
    )
  }

  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: EMAIL } },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: "users",
      id: existing.docs[0].id,
      data: { password: PASSWORD },
    })
    console.log(`Password reset for existing user ${EMAIL} (${existing.docs[0].id}).`)
  } else {
    const created = await payload.create({
      collection: "users",
      data: { email: EMAIL, password: PASSWORD },
    })
    console.log(`Created admin user ${EMAIL} (${created.id}).`)
  }

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
