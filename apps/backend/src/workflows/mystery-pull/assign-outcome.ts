import { randomUUID } from "node:crypto";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";

export type AssignOutcomeStepInput = {
  pool_id: string;
  line_item_id: string;
};

export type AssignedOutcome = {
  id: string;
  pool_id: string;
  rarity_tier: string;
  rarity_color: string;
  linked_product_id: string;
  linked_variant_id: string | null;
  remaining_qty: number;
};

type AssignOutcomeCompensateInput = {
  outcome_id: string;
  pool_id: string;
  pool_deactivated: boolean;
  line_item_id: string;
};

type PullOutcomeRow = {
  id: string;
  pool_id: string;
  rarity_tier: string;
  rarity_color: string;
  weight: number;
  linked_product_id: string;
  linked_variant_id: string | null;
  remaining_qty: number;
};

/**
 * Weighted random pick over the given (already-locked, already-filtered-to-
 * remaining_qty > 0) outcomes. Assumes `outcomes` is non-empty.
 */
function pickWeighted(outcomes: PullOutcomeRow[]): PullOutcomeRow {
  const totalWeight = outcomes.reduce((sum, o) => sum + Number(o.weight), 0);
  let roll = Math.random() * totalWeight;

  for (const outcome of outcomes) {
    roll -= Number(outcome.weight);
    if (roll <= 0) {
      return outcome;
    }
  }

  // Floating-point safety net — should be unreachable given the math above,
  // but never leave a pick unresolved.
  return outcomes[outcomes.length - 1];
}

/**
 * Atomically assigns one outcome from a mystery-pull pool: locks every
 * pull_outcome row for the pool (SELECT ... FOR UPDATE) for the duration of
 * a single DB transaction, so concurrent draws against the same pool are
 * fully serialized against each other — two callers can never both walk
 * away with the last copy of a scarce outcome. Decrements the chosen
 * outcome's remaining_qty and, if that was the pool's last unit across all
 * outcomes, deactivates the pool — both inside the same transaction/lock.
 *
 * Also inserts a row into `pull_assignment`, keyed uniquely on
 * `line_item_id` (see models/pull-assignment.ts), in that same
 * transaction. This is the hard, database-level guarantee that a line
 * item is assigned at most once — not just an application-level "is it
 * already assigned" read beforehand. That distinction matters: this
 * codebase had exactly that kind of read (via query.graph) turn out to be
 * unreliable in practice — see CLAUDE.md's Mystery Pull module note. If a
 * second assignment is ever attempted for a line item that already has
 * one — a caller bug, a race between the subscriber and the reconciliation
 * sweep, a stale read anywhere, doesn't matter which — the INSERT below
 * hits a unique-constraint violation, the whole transaction rolls back
 * (so remaining_qty is never decremented for the duplicate), and the step
 * throws. The eligibility checks upstream of this step (in the subscriber
 * and the sweep) still exist and still matter — they're what keep this
 * from being called at all in the common case — but this is what makes it
 * *impossible*, not just unlikely, for a duplicate to actually take effect.
 *
 * Deliberately does *not* touch inventory — see decrement-inventory.ts.
 * Keeping that in its own step (rather than a plain `await` after this
 * step's transaction commits) is what makes the two-part assignment
 * genuinely all-or-nothing: if the inventory step then fails, Medusa's
 * workflow engine compensates this step automatically because it
 * successfully returned a StepResponse; a plain post-commit side effect
 * inside this same invoke function would not get that for free — if it
 * threw, this step would never reach its own `return`, so there'd be no
 * compensateInput and this step's own compensation would never run,
 * leaving the outcome "spent" with no inventory movement to show for it.
 *
 * Throws a "pool sold out" MedusaError if no outcome in the pool has
 * remaining_qty > 0. Throws Postgres's own unique-violation error
 * (uncaught, on purpose — a duplicate assignment attempt is a real bug
 * upstream and should be loud, not swallowed) if `line_item_id` already
 * has an assignment.
 */
export const assignOutcomeStep = createStep(
  "assign-mystery-pull-outcome",
  async (input: AssignOutcomeStepInput, { container }) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const { picked, poolDeactivated } = await knex.transaction(async (trx: any) => {
      const outcomes: PullOutcomeRow[] = await trx("pull_outcome")
        .where({ pool_id: input.pool_id })
        .whereNull("deleted_at")
        .forUpdate();

      const eligible = outcomes.filter((o) => Number(o.remaining_qty) > 0);

      if (!eligible.length) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Mystery pull pool "${input.pool_id}" is sold out — no outcomes with remaining stock.`
        );
      }

      const chosen = pickWeighted(eligible);
      const newRemainingQty = Number(chosen.remaining_qty) - 1;

      // The hard guarantee — see doc comment above. Deliberately not
      // wrapped in try/catch: a unique-violation here must abort this
      // transaction (rolling back the decrement below) and propagate as a
      // real, visible error, not be caught and quietly ignored.
      await trx("pull_assignment").insert({
        id: randomUUID(),
        line_item_id: input.line_item_id,
        pool_id: input.pool_id,
        outcome_id: chosen.id,
      });

      await trx("pull_outcome").where({ id: chosen.id }).update({
        remaining_qty: newRemainingQty,
        updated_at: new Date(),
      });

      // Still holding the lock on every outcome row for this pool, so this
      // check can't race with another concurrent draw.
      const anyStockLeft =
        newRemainingQty > 0 ||
        outcomes.some((o) => o.id !== chosen.id && Number(o.remaining_qty) > 0);

      let deactivated = false;
      if (!anyStockLeft) {
        await trx("pull_pool")
          .where({ id: input.pool_id })
          .update({ is_active: false, updated_at: new Date() });
        deactivated = true;
      }

      return {
        picked: { ...chosen, remaining_qty: newRemainingQty } as PullOutcomeRow,
        poolDeactivated: deactivated,
      };
    });

    const output: AssignedOutcome = {
      id: picked.id,
      pool_id: picked.pool_id,
      rarity_tier: picked.rarity_tier,
      rarity_color: picked.rarity_color,
      linked_product_id: picked.linked_product_id,
      linked_variant_id: picked.linked_variant_id,
      remaining_qty: picked.remaining_qty,
    };

    const compensateInput: AssignOutcomeCompensateInput = {
      outcome_id: picked.id,
      pool_id: input.pool_id,
      pool_deactivated: poolDeactivated,
      line_item_id: input.line_item_id,
    };

    return new StepResponse(output, compensateInput);
  },
  async (compensateInput, { container }) => {
    if (!compensateInput) {
      return;
    }

    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    await knex.transaction(async (trx: any) => {
      await trx("pull_assignment")
        .where({ line_item_id: compensateInput.line_item_id })
        .delete();

      await trx("pull_outcome")
        .where({ id: compensateInput.outcome_id })
        .increment("remaining_qty", 1)
        .update({ updated_at: new Date() });

      if (compensateInput.pool_deactivated) {
        await trx("pull_pool")
          .where({ id: compensateInput.pool_id })
          .update({ is_active: true, updated_at: new Date() });
      }
    });
  }
);
