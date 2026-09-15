"use client"

import { motion } from "framer-motion"

export type CategoryTab = {
  id: string
  name: string
  handle: string
  badge: string
}

/**
 * Category tabs styled like physical binder-divider tabs: rounded top
 * corners, square bottom corners, a coloured top strip — matching
 * design-reference/mowy-homepage.html's .cat-tab (see .tab-row/.cat-tab).
 */
export default function CategoryTabs({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: CategoryTab[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-1.5">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId

        return (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={isActive}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`min-w-[168px] flex-none rounded-t-xl rounded-b border border-t-[3px] px-[18px] pb-4 pt-5 text-left transition-colors duration-200 ${
              isActive
                ? "border-t-holo-a bg-panel-soft border-cobalt/40"
                : "border-t-cobalt bg-panel border-line"
            }`}
          >
            <div className="font-mono text-[10.5px] text-chrome-dim">
              {tab.badge}
            </div>
            <h3 className="mt-1.5 text-h4 text-chrome">{tab.name}</h3>
          </motion.button>
        )
      })}
    </div>
  )
}
