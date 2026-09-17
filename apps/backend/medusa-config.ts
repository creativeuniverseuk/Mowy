import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

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
    {
      resolve: "@medusajs/medusa/search",
      options: {
        providers: [
          {
            resolve: "@rokmohar/medusa-plugin-meilisearch/providers/meilisearch",
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
              redirectUrl: `${process.env.STOREFRONT_URL}/checkout/sumup/return`,
            },
          },
        ],
      },
    },
  ],
})
