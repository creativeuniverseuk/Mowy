const c = require("ansi-colors")

const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    // TODO: we need a good doc to point this to
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys",
  },
  {
    key: "PAYLOAD_SECRET",
    description:
      "Used by Payload CMS (src/payload.config.ts) to sign/encrypt auth tokens. Any long random string.",
  },
  {
    key: "PAYLOAD_DATABASE_URI",
    description:
      "Postgres connection string for Payload CMS (src/payload.config.ts) — the same Postgres instance Medusa uses, with schemaName: \"payload\" keeping its tables in their own schema.",
  },
  {
    key: "PAYLOAD_PREVIEW_SECRET",
    description:
      "Authenticates GET /next/preview (src/app/(payload)/next/preview/route.ts), which Pages' live preview uses to enable Next.js draft mode. Any long random string.",
  },
]

function checkEnvVariables() {
  const missingEnvs = requiredEnvs.filter(function (env) {
    return !process.env[env.key]
  })

  if (missingEnvs.length > 0) {
    console.error(
      c.red.bold("\n🚫 Error: Missing required environment variables\n")
    )

    missingEnvs.forEach(function (env) {
      console.error(c.yellow(`  ${c.bold(env.key)}`))
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`))
      }
    })

    console.error(
      c.yellow(
        "\nPlease set these variables in your .env file or environment before starting the application.\n"
      )
    )

    process.exit(1)
  }
}

module.exports = checkEnvVariables
