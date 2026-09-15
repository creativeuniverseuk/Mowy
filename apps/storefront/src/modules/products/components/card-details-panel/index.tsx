import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardDetail } from "types/card-detail"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-b-0">
      <span className="font-mono text-xs uppercase tracking-[0.1em] text-chrome-dim">
        {label}
      </span>
      <span className="text-sm font-medium text-chrome">{value}</span>
    </div>
  )
}

export default function CardDetailsPanel({
  cardDetail,
}: {
  cardDetail: CardDetail
}) {
  return (
    <Card className="border-line bg-panel">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-h4 text-chrome">Card details</CardTitle>
        {cardDetail.is_graded ? (
          <Badge variant="live">Graded</Badge>
        ) : (
          <Badge variant="secondary">Ungraded</Badge>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <Row label="Set" value={cardDetail.card_set} />
        <Row label="Rarity" value={cardDetail.rarity} />
        <Row label="Condition" value={cardDetail.condition} />
        <Row
          label="Grading"
          value={
            cardDetail.is_graded
              ? `${cardDetail.grading_company ?? "Graded"}${
                  cardDetail.grade != null ? ` ${cardDetail.grade}` : ""
                }`
              : "Ungraded"
          }
        />
      </CardContent>
    </Card>
  )
}
