"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import type { Page } from "@/payload-types"

type HeroBannerBlockProps = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "heroBanner" }
>

export default function HeroBanner({
  heading,
  subheading,
  image,
  cta,
}: HeroBannerBlockProps) {
  const imageUrl = typeof image === "object" && image?.url ? image.url : null
  const imageAlt = typeof image === "object" && image?.alt ? image.alt : heading

  return (
    <section className="relative overflow-hidden border-b border-line bg-ink">
      {imageUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
        </div>
      )}

      <div className="content-container relative py-24 lg:py-32">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-3xl text-display text-chrome"
        >
          {heading}
        </motion.h1>

        {subheading && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="mt-5 max-w-xl text-body-lg leading-[1.7] text-chrome-dim"
          >
            {subheading}
          </motion.p>
        )}

        {cta?.label && cta?.url && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="mt-8"
          >
            <Link
              href={cta.url}
              className="inline-flex items-center rounded-md bg-cobalt px-6 py-3 text-body-sm font-medium text-chrome transition-colors hover:bg-cobalt-soft"
            >
              {cta.label}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
