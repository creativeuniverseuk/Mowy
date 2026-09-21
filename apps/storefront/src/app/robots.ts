import { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/next/preview",
          "/next/exit-preview",
          "/*/cart",
          "/*/checkout",
          "/*/account",
          "/*/order",
          // Fixed path outside [countryCode] — see CLAUDE.md's
          // sameSite cookie note on the SumUp hosted-checkout return.
          "/checkout/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
