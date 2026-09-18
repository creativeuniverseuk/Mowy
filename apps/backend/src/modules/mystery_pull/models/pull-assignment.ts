import { model } from "@medusajs/framework/utils";

/**
 * The hard, database-level guarantee that a line item is assigned an
 * outcome at most once — see assign-outcome.ts's doc comment for why an
 * application-level "already assigned" read (however careful) isn't
 * enough on its own, and CLAUDE.md's Mystery Pull module note for the
 * incident that made this necessary. `line_item_id` is unique, so a
 * second INSERT attempt for the same line item fails with a Postgres
 * unique-violation, inside the same transaction as the stock decrement in
 * assign-outcome.ts — not a separate check that could itself read stale
 * data.
 */
const PullAssignment = model.define("pull_assignment", {
  id: model.id().primaryKey(),
  line_item_id: model.text().unique(),
  pool_id: model.text(),
  outcome_id: model.text(),
});

export default PullAssignment;
