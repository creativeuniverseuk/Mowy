"use client"

import { HttpTypes } from "@medusajs/types"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

import CategoryTabs, { CategoryTab } from "../category-tabs"
import ProductGrid from "../product-grid"

export default function ShowcaseGrid({
  tabs,
  productsByCategory,
}: {
  tabs: CategoryTab[]
  productsByCategory: Record<string, HttpTypes.StoreProduct[]>
}) {
  const [activeId, setActiveId] = useState(tabs[0].id)
  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0]

  return (
    <div>
      <CategoryTabs tabs={tabs} activeId={activeId} onSelect={setActiveId} />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <ProductGrid
              products={productsByCategory[activeId] ?? []}
              emptyLabel={`No cards sleeved in ${activeTab.name} yet — check back soon.`}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
