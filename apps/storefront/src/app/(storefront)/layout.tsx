import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google"
import OrganizationJsonLd from "@modules/layout/components/organization-jsonld"
import "styles/globals.css"

const DEFAULT_TITLE = "MOWY — Trading Cards & Collectibles"
const DEFAULT_DESCRIPTION =
  "Hand-checked Pokémon TCG, 3D-printed figures, and a growing shelf of Lorcana, Riftbound and beyond — UK trading cards and collectibles from MOWY."

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | MOWY",
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "MOWY",
    locale: "en_GB",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body className="bg-ink text-chrome">
        <OrganizationJsonLd />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
