"use client"

import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { colors, radius } from "@lib/design-tokens"
import { typeScale } from "@lib/typography"

const colorGroups: { title: string; tokens: (keyof typeof colors)[] }[] = [
  { title: "Brand", tokens: ["ink", "chrome", "cobalt"] },
  {
    title: "Surfaces & borders",
    tokens: ["ink-2", "panel", "panel-soft", "line", "chrome-dim", "cobalt-soft"],
  },
  {
    title: "Stock status (semantic — never reuse for brand chrome)",
    tokens: ["live", "low-stock", "out-of-stock"],
  },
]

function ColorSwatch({ token }: { token: keyof typeof colors }) {
  const { hex } = colors[token]
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-12 w-12 shrink-0 rounded-lg border border-line"
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className="font-mono text-sm text-chrome">{token}</p>
        <p className="font-mono text-xs text-chrome-dim">{hex}</p>
      </div>
    </div>
  )
}

function TypeSample({ token }: { token: keyof typeof typeScale }) {
  const sample = typeScale[token]
  return (
    <div className="flex flex-col gap-1 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-xs text-chrome-dim">
          text-{token}
        </span>
        <span className="text-xs text-chrome-dim">{sample.use}</span>
      </div>
      <p
        style={{
          fontFamily: sample.fontFamily,
          fontSize: sample.fontSize,
          lineHeight: sample.lineHeight,
          letterSpacing: sample.letterSpacing,
          fontWeight: sample.fontWeight,
        }}
      >
        MOWY — Play, Protect, Collect
      </p>
    </div>
  )
}

export default function TokenReference() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="content-container flex flex-col gap-12 py-16"
    >
      <div>
        <h1 className="text-h1">MOWY design tokens</h1>
        <p className="mt-2 text-body text-chrome-dim">
          Reference for the colour, type, and radius tokens defined in{" "}
          <code className="font-mono text-cobalt">
            src/design-tokens.js
          </code>{" "}
          and{" "}
          <code className="font-mono text-cobalt">src/type-scale.js</code>.
        </p>
      </div>

      <section className="flex flex-col gap-8">
        <h2 className="text-h2">Colour</h2>
        {colorGroups.map((group) => (
          <Card key={group.title} className="border-line bg-panel">
            <CardHeader>
              <CardTitle className="text-h4">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tokens.map((token) => (
                <ColorSwatch key={token} token={token} />
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-h2">Type scale</h2>
        <Card className="border-line bg-panel">
          <CardContent className="divide-y divide-line pt-6">
            {(Object.keys(typeScale) as (keyof typeof typeScale)[]).map(
              (token) => (
                <TypeSample key={token} token={token} />
              )
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2">Stock status badges</h2>
        <Card className="border-line bg-panel">
          <CardContent className="flex flex-wrap gap-3 pt-6">
            <Badge variant="live">In stock</Badge>
            <Badge variant="low-stock">Low stock</Badge>
            <Badge variant="out-of-stock">Out of stock</Badge>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2">Radius</h2>
        <Card className="border-line bg-panel">
          <CardContent className="flex flex-wrap gap-6 pt-6">
            {(Object.keys(radius) as (keyof typeof radius)[]).map((token) => (
              <div key={token} className="flex flex-col items-center gap-2">
                <div
                  className="h-16 w-16 border border-cobalt bg-panel-soft"
                  style={{ borderRadius: radius[token] }}
                />
                <span className="font-mono text-xs text-chrome-dim">
                  {token} — {radius[token]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-line" />
    </motion.div>
  )
}
