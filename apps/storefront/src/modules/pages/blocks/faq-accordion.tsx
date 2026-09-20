"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { Page } from "@/payload-types"

type FAQAccordionProps = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "faqAccordion" }
>

export default function FAQAccordion({ items }: FAQAccordionProps) {
  if (!items?.length) {
    return null
  }

  return (
    <section className="border-b border-line bg-ink-2">
      <div className="content-container max-w-3xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem key={item.id ?? index} value={item.id ?? String(index)}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
