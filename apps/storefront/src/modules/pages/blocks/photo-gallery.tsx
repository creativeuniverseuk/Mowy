"use client"

import { motion } from "framer-motion"
import type { Page } from "@/payload-types"

type PhotoGalleryProps = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "photoGallery" }
>

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  if (!images?.length) {
    return null
  }

  return (
    <section className="border-b border-line bg-ink">
      <div className="content-container py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((item, index) => {
            const url = typeof item.image === "object" ? item.image?.url : null
            const alt =
              typeof item.image === "object" && item.image?.alt
                ? item.image.alt
                : "Gallery photo"

            if (!url) {
              return null
            }

            return (
              <motion.div
                key={item.id ?? index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                className="aspect-square overflow-hidden rounded-xl border border-line bg-panel"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={alt}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
