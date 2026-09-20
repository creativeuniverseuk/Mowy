"use client"

import { motion } from "framer-motion"
import type { Page } from "@/payload-types"

type TeamGridProps = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "teamGrid" }
>

/**
 * No team-grid mockup exists in /design-reference (only the homepage and
 * admin mockups do) — this follows the same card/mono-label language those
 * use (see StoryBand, apps/storefront's home components) rather than a
 * literal reference design.
 */
export default function TeamGrid({ members }: TeamGridProps) {
  if (!members?.length) {
    return null
  }

  return (
    <section className="border-b border-line bg-ink-2">
      <div className="content-container py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => {
            const photoUrl =
              typeof member.photo === "object" && member.photo?.url
                ? member.photo.url
                : null
            const photoAlt =
              typeof member.photo === "object" && member.photo?.alt
                ? member.photo.alt
                : member.name

            return (
              <motion.div
                key={member.id ?? index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
                className="flex flex-col items-center rounded-2xl border border-line bg-panel p-8 text-center"
              >
                <div className="mb-5 h-24 w-24 overflow-hidden rounded-full border border-line bg-panel-soft">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt={photoAlt ?? member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-headline text-h3 text-chrome-dim">
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <h3 className="text-h4 text-chrome">{member.name}</h3>
                {member.role && (
                  <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.12em] text-cobalt-soft">
                    {member.role}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
