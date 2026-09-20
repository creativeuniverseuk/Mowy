import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Jest sets NODE_ENV=test by default. Integration tests (see
// integration-tests/) boot a real, isolated app instance from this same
// config file against a throwaway database — but there's no Meilisearch
// instance for them to reach, and @medusajs/test-utils's app-boot sequence
// doesn't tolerate that the way `medusa develop`'s does (a failed search
// index migration there is only ever logged, never fatal). Registering the
// search module is what makes the test runner attempt that migration at
// all, so it's skipped entirely under test — this file's actual search
// config below is untouched for dev/production.
const isTestEnv = process.env.NODE_ENV === 'test'

module.exports = defineConfig({
  plugins: [
    {
      resolve: "@rokmohar/medusa-plugin-meilisearch",
      options: {},
    },
    {
      resolve: "@sumup/medusa-plugin",
      options: {},
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "./src/modules/card_detail",
    },
    {
      resolve: "./src/modules/mystery_pull",
    },
    {
      resolve: "./src/modules/site_settings",
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@tsc_tech/medusa-plugin-cloudinary/providers/file-cloudinary",
            id: "cloudinary",
            options: {
              cloudName: process.env.CLOUDINARY_CLOUD_NAME,
              apiKey: process.env.CLOUDINARY_API_KEY,
              apiSecret: process.env.CLOUDINARY_API_SECRET,
            },
            /**
             * S3-compatible alternative — swap the provider above for this
             * one if we move off Cloudinary. Ships with @medusajs/medusa,
             * no extra install needed.
             *
             * {
             *   resolve: "@medusajs/medusa/file-s3",
             *   id: "s3",
             *   options: {
             *     file_url: process.env.S3_FILE_URL,
             *     access_key_id: process.env.S3_ACCESS_KEY_ID,
             *     secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
             *     region: process.env.S3_REGION,
             *     bucket: process.env.S3_BUCKET,
             *     endpoint: process.env.S3_ENDPOINT,
             *     // Only needed for path-style S3-compatible providers (e.g.
             *     // MinIO, Supabase Storage) — leave unset for AWS S3 itself.
             *     // additional_client_config: { forcePathStyle: true },
             *   },
             * }
             */
          },
        ],
      },
    },
    ...(isTestEnv
      ? []
      : [
          {
            resolve: "@medusajs/medusa/search",
            options: {
              providers: [
                {
                  resolve:
                    "@rokmohar/medusa-plugin-meilisearch/providers/meilisearch",
                  id: "meilisearch",
                  options: {
                    config: {
                      host: process.env.MEILISEARCH_HOST!,
                      apiKey: process.env.MEILISEARCH_API_KEY,
                    },
                  },
                },
              ],
            },
          },
        ]),
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@sumup/medusa-plugin/providers/sumup",
            id: "sumup",
            options: {
              apiKey: process.env.SUMUP_API_KEY,
              merchantCode: process.env.SUMUP_MERCHANT_CODE,
              checkoutMode: "hosted",
              returnUrl: `${process.env.MEDUSA_BACKEND_URL}/hooks/payment/sumup_sumup`,
              // Fallback only — the storefront's payment step
              // (modules/checkout/components/payment) overrides this
              // per-session with a `redirect_url` that embeds the cart id,
              // since the _medusa_cart_id cookie isn't reliably present on
              // every browser's cross-site redirect back from SumUp. This
              // static value only applies to a session that didn't set its
              // own (see @sumup/medusa-plugin's createCheckoutPayload).
              redirectUrl: `${process.env.STOREFRONT_URL}/checkout/sumup/return`,
            },
          },
        ],
      },
    },
  ],
})
