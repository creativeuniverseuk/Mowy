"use client"

import { motion } from "framer-motion"

export default function StoryBand() {
  return (
    <section className="border-y border-line bg-ink-2">
      <div className="content-container grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[440px_1fr] lg:gap-[60px] lg:py-[74px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line"
          style={{
            background:
              "repeating-linear-gradient(45deg, rgba(59,110,255,0.05) 0 2px, transparent 2px 14px), linear-gradient(145deg,#232432,#171821)",
          }}
        >
          <span className="absolute bottom-[18px] left-[18px] font-mono text-[11px] tracking-[0.12em] text-chrome-dim">
            EST. ABINGDON ST MARKET
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <div className="mb-4 flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-cobalt-soft">
            <span className="h-px w-[22px] bg-cobalt-soft" />
            Our story
          </div>
          <h2 className="mb-4 text-h2 text-chrome">
            Started on a market table.
            <br />
            Still runs like one.
          </h2>
          <p className="mb-3.5 max-w-[520px] text-body-lg leading-[1.7] text-chrome-dim">
            MOWY began as a stall at Abingdon Street Market in Blackpool,
            trading Pokémon cards face to face with collectors who knew their
            stuff. That&rsquo;s still how we check every card today — by
            hand, before it goes anywhere near a mailbox.
          </p>
          <p className="max-w-[520px] text-body-lg leading-[1.7] text-chrome-dim">
            As the shelf grew, so did the family behind it — now stocking
            3D-printed figures alongside an expanding lineup of Lorcana,
            Riftbound and more.
          </p>
          <div className="mt-[18px] font-mono text-[12.5px] text-cobalt-soft">
            — The MOWY family, Blackpool
          </div>
        </motion.div>
      </div>
    </section>
  )
}
