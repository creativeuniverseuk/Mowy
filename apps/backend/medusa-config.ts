import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
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
  ],
})
