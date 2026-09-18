import loaders from "@medusajs/medusa/loaders/index";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import type { MedusaContainer } from "@medusajs/framework/types";
import { assignOutcomeStep } from "../../src/workflows/mystery-pull/assign-outcome";
import { decrementInventoryForOutcomeStep } from "../../src/workflows/mystery-pull/decrement-inventory";
import { assignMysteryPullOutcomeWorkflow } from "../../src/workflows/mystery-pull";
import { MYSTERY_PULL_MODULE } from "../../src/modules/mystery_pull";

/**
 * Regression coverage for the assign-mystery-pull-outcome workflow's
 * all-or-nothing compensation behavior (see the "single vs multi-step
 * compensation" discussion this file exists to answer permanently, instead
 * of only in session history).
 *
 * Deliberately lighter-weight than mystery-pull-assignment.spec.ts: rather
 * than medusaIntegrationTestRunner (which creates an isolated database from
 * scratch, runs every core + custom migration, and boots a full HTTP
 * server — reliably too heavy for this dev machine's available memory),
 * this boots the same fully-wired container `medusa exec` uses —
 * `@medusajs/medusa`'s own `loaders` entrypoint, connecting to whatever
 * database DATABASE_URL/DB_* env vars already point at (already migrated,
 * not created/dropped here) — with no HTTP server and no database
 * create/migrate/drop overhead. It still exercises the *real* workflow
 * engine, real product/inventory/order modules, and real Postgres
 * transactions; only the bootstrap is lighter. This same approach will
 * work in CI/on Railway (Phase 9) against a pre-migrated test database —
 * it doesn't depend on this machine's limits, just on a reachable, already-
 * migrated Postgres.
 *
 * Test data (product/variant/inventory/pool/outcomes) is created and torn
 * down around each test, since — unlike the isolated-DB runner — this runs
 * against a persistent database.
 */

const TEST_PRODUCT_TITLE = "Mystery Pull Compensation Test Pack";

// Stands in for "a later step failed", to prove the engine's automatic
// reverse-order compensation independent of contriving a specific
// business failure for every step.
const alwaysFailStep = createStep("always-fail-compensation-test-step", async () => {
  throw new Error("deliberate test failure");
});

const failAfterAssignWorkflow = createWorkflow(
  "test-fail-after-assign-outcome",
  (input: { pool_id: string; line_item_id: string }) => {
    const outcome = assignOutcomeStep(input);
    alwaysFailStep();
    return new WorkflowResponse(outcome);
  }
);

describe("Mystery pull assignment compensation", () => {
  jest.setTimeout(60000);

  let container: MedusaContainer;
  let shutdown: () => Promise<void>;

  let productId: string;
  let variantId: string;
  let locationId: string;
  let inventoryItemId: string;

  beforeAll(async () => {
    // `expressApp` is only touched by loaders' entrypoint-loading path
    // (route registration); skipLoadingEntryPoints: true means it's never
    // called, so a stub avoids pulling in a real `express` dependency.
    const loaded = await loaders({
      directory: process.cwd(),
      expressApp: {} as any,
      skipLoadingEntryPoints: true,
    });
    container = loaded.container;
    shutdown = loaded.shutdown;

    const productModuleService = container.resolve(Modules.PRODUCT);
    const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
    const inventoryModuleService = container.resolve(Modules.INVENTORY);
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    const location = await stockLocationModuleService.createStockLocations({
      name: "Compensation Test Warehouse",
    });
    locationId = location.id;

    const product = (await productModuleService.createProducts({
      title: TEST_PRODUCT_TITLE,
      status: "published" as any,
      options: [{ title: "Type", values: ["Default"] }],
      variants: [
        { title: "Default", options: { Type: "Default" }, manage_inventory: true },
      ],
    } as any)) as any;
    productId = product.id;
    variantId = product.variants[0].id;

    const inventoryItem = await inventoryModuleService.createInventoryItems({
      sku: "MYSTERY-PULL-COMPENSATION-TEST",
    });
    inventoryItemId = inventoryItem.id;

    await inventoryModuleService.createInventoryLevels([
      { inventory_item_id: inventoryItemId, location_id: locationId, stocked_quantity: 100 },
    ]);

    await link.create({
      [Modules.PRODUCT]: { variant_id: variantId },
      [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
    });
  });

  afterAll(async () => {
    const productModuleService = container.resolve(Modules.PRODUCT);
    const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
    const inventoryModuleService = container.resolve(Modules.INVENTORY);
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await link.dismiss({
      [Modules.PRODUCT]: { variant_id: variantId },
      [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
    });
    await inventoryModuleService.deleteInventoryItems([inventoryItemId]);
    await productModuleService.deleteProducts([productId]);
    await stockLocationModuleService.deleteStockLocations([locationId]);

    await shutdown();
  });

  async function createPool() {
    const mysteryPullModuleService = container.resolve(MYSTERY_PULL_MODULE) as any;
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    const pool = await mysteryPullModuleService.createPullPools({
      theme_key: `compensation-test-${Date.now()}-${Math.random()}`,
      pack_art_url: null,
      is_active: true,
    });
    await link.create({
      [Modules.PRODUCT]: { product_id: productId },
      [MYSTERY_PULL_MODULE]: { pull_pool_id: pool.id },
    });
    const outcome = await mysteryPullModuleService.createPullOutcomes({
      pool_id: pool.id,
      rarity_tier: "Only",
      rarity_color: "#3b6eff",
      weight: 1,
      linked_product_id: productId,
      linked_variant_id: variantId,
      remaining_qty: 1,
    });

    return { pool, outcome };
  }

  async function cleanupPool(pool: any, outcome: any) {
    const mysteryPullModuleService = container.resolve(MYSTERY_PULL_MODULE) as any;
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    await link.dismiss({
      [Modules.PRODUCT]: { product_id: productId },
      [MYSTERY_PULL_MODULE]: { pull_pool_id: pool.id },
    });
    // A successful (non-compensated) assignment in a test leaves a real
    // pull_assignment row behind — compensated ones don't (assign-outcome's
    // own compensation deletes it), but this file runs against a
    // persistent database, so anything that *can* survive a run must be
    // cleaned up or a second run collides with it on the unique
    // line_item_id constraint.
    const { data: assignments } = await query.graph({
      entity: "pull_assignment",
      fields: ["id"],
      filters: { pool_id: pool.id } as any,
    });
    await mysteryPullModuleService.deletePullAssignments(
      assignments.map((a: any) => a.id)
    );
    await mysteryPullModuleService.deletePullOutcomes([outcome.id]);
    await mysteryPullModuleService.deletePullPools([pool.id]);
  }

  async function getOutcomeQty(outcomeId: string): Promise<number> {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "pull_outcome",
      fields: ["id", "remaining_qty"],
      filters: { id: outcomeId } as any,
    });
    return (data[0] as any).remaining_qty;
  }

  async function getPoolActive(poolId: string): Promise<boolean> {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const { data } = await query.graph({
      entity: "pull_pool",
      fields: ["id", "is_active"],
      filters: { id: poolId } as any,
    });
    return (data[0] as any).is_active;
  }

  async function getInventoryStock(): Promise<number> {
    const inventoryModuleService = container.resolve(Modules.INVENTORY);
    const level = await inventoryModuleService.retrieveInventoryLevelByItemAndLocation(
      inventoryItemId,
      locationId
    );
    return Number(level.stocked_quantity);
  }

  it("compensates assign-outcome when the very next step fails (single-step failure)", async () => {
    const { pool, outcome } = await createPool();
    try {
      let thrown: Error | null = null;
      try {
        await failAfterAssignWorkflow(container).run({
          input: { pool_id: pool.id, line_item_id: "ordli_single_step_test" },
        });
      } catch (err: any) {
        thrown = err;
      }

      expect(thrown?.message).toContain("deliberate test failure");
      expect(await getOutcomeQty(outcome.id)).toBe(1);
      expect(await getPoolActive(pool.id)).toBe(true);
    } finally {
      await cleanupPool(pool, outcome);
    }
  });

  it("compensates both assign-outcome and inventory decrement, in reverse order, when the real workflow's final step fails (multi-step failure)", async () => {
    const { pool, outcome } = await createPool();
    try {
      const stockBefore = await getInventoryStock();

      // A line item id that cannot exist triggers a real, organic failure in
      // writeOutcomeMetadataStep (order.updateOrderLineItems on an unknown
      // id) — this runs the actual exported production workflow end to end,
      // not a stand-in step, so this specifically proves the real assign +
      // real inventory-decrement steps both roll back when the real third
      // step fails for a genuine reason.
      let thrown: Error | null = null;
      try {
        await assignMysteryPullOutcomeWorkflow(container).run({
          input: { pool_id: pool.id, line_item_id: "ordli_does_not_exist" },
        });
      } catch (err: any) {
        thrown = err;
      }

      expect(thrown).not.toBeNull();
      expect(await getOutcomeQty(outcome.id)).toBe(1);
      expect(await getPoolActive(pool.id)).toBe(true);
      expect(await getInventoryStock()).toBe(stockBefore);
    } finally {
      await cleanupPool(pool, outcome);
    }
  });

  it("still lets a successful run through both steps decrement inventory for real (sanity check for the test above)", async () => {
    const { pool, outcome } = await createPool();
    try {
      const stockBefore = await getInventoryStock();

      const { result } = await (
        createWorkflow(
          "test-assign-and-decrement-only",
          (input: { pool_id: string; line_item_id: string }) => {
            const o = assignOutcomeStep(input);
            decrementInventoryForOutcomeStep({ outcome: o });
            return new WorkflowResponse(o);
          }
        )
      )(container).run({
        input: { pool_id: pool.id, line_item_id: "ordli_decrement_sanity_test" },
      });

      expect(result.id).toBe(outcome.id);
      expect(await getOutcomeQty(outcome.id)).toBe(0);
      expect(await getInventoryStock()).toBe(stockBefore - 1);
    } finally {
      await cleanupPool(pool, outcome);
    }
  });
});
