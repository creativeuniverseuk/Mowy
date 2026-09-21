import { Metadata } from "next"
import TokenReference from "@modules/common/components/token-reference"

export const metadata: Metadata = {
  title: "Design Tokens",
  robots: { index: false, follow: false },
}

export default function DesignTokensPage() {
  return <TokenReference />
}
