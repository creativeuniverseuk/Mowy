"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export default function NewsletterBand() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle")

  return (
    <section className="content-container py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h2 className="mb-3.5 text-h2 text-chrome">
          Get first look at new stock
        </h2>
        <p className="mb-[30px] text-chrome-dim">
          Restocks, rare pulls and market-day drops — straight to your
          inbox, no spam.
        </p>

        {status === "submitted" ? (
          <p className="font-mono text-sm text-cobalt-soft">
            You&rsquo;re on the list — thanks for signing up.
          </p>
        ) : (
          <form
            className="mx-auto flex max-w-[440px] flex-wrap justify-center gap-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              setStatus("submitted")
            }}
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              aria-label="Email address"
              className="min-w-[220px] flex-1 rounded-[9px] border border-line bg-panel px-4 py-3.5 text-sm text-chrome placeholder:text-chrome-dim focus:border-cobalt-soft focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-[9px] bg-chrome px-6 py-3.5 text-sm font-semibold text-ink transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,110,255,0.25)]"
            >
              Sign up
            </button>
          </form>
        )}
      </motion.div>
    </section>
  )
}
