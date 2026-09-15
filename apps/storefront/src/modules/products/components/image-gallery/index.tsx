"use client"

import { HttpTypes } from "@medusajs/types"
import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"

export default function ImageGallery({
  images,
  title,
}: {
  images: HttpTypes.StoreProductImage[]
  title: string
}) {
  const [active, setActive] = useState(0)
  const current = images[active]

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-[14px] border border-line bg-panel">
        {current?.url ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={`${title} — image ${active + 1}`}
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 560px"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(150deg,#26314a,#12151d)",
            }}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                i === active
                  ? "border-cobalt"
                  : "border-line hover:border-cobalt-soft"
              }`}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
            >
              {image.url && (
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
