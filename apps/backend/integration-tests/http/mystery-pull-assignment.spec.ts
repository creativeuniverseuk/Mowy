import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { assignOutcomeStep } from "../../src/workflows/mystery-pull/assign-outcome";
import { MYSTERY_PULL_MODULE } from "../../src/modules/mystery_pull";

/**
 * Test-only workflow wrapping just the assign-outcome step. The concurrency
 * property under test — only one caller can ever win the last copy of a
 * scarce outcome — lives entirely in that step's row lock, so the
 * metadata-writing step (which needs a real order and is exercised
 * separately, see src/scripts/verify-mystery-pull-links.ts-style manual
 * smoke testing during development) is deliberately left out here to keep
 * the fixture to just product/variant/inventory + pool/outcomes.
 */
const testAssignWorkflow = createWorkflow(
  "test-assign-mystery-pull-outcome",
  (input: { pool_id: string }) => {
    const outcome = assignOutcomeStep(input);
    return new WorkflowResponse(outcome);
  }
);

jest.setTimeout(180000);

medusaIntegrationTestRunner({
  moduleName: "mystery-pull-assignment",
  testSuite: ({ getContainer }) => {
    describe("Mystery pull assignment concurrency", () => {
      let productId: string;
      let variantId: string;
      let inventoryItemId: string;
      let locationId: string;

      beforeAll(async () => {
        const container = getContainer();
        const productModuleService = container.resolve(Modules.PRODUCT);
        const stockLocationModuleService = container.resolve(
          Modules.STOCK_LOCATION
        );
        const inventoryModuleService = container.resolve(Modules.INVENTORY);
        const link = container.resolve(ContainerRegistrationKeys.LINK);

        const location = await stockLocationModuleService.createStockLocations(
          { name: "Test Warehouse" }
        );
        locationId = location.id;

        const product = (await productModuleService.createProducts({
          title: "Mystery Pull Concurrency Test Pack",
          status: "published" as any,
          options: [{ title: "Type", values: ["Default"] }],
          variants: [
            {
              title: "Default",
              options: { Type: "Default" },
              manage_inventory: true,
            },
          ],
        } as any)) as any;
        productId = product.id;
        variantId = product.variants[0].id;

        const inventoryItem = await inventoryModuleService.createInventoryItems(
          { sku: "MYSTERY-PULL-CONCURRENCY-TEST" }
        );
        inventoryItemId = inventoryItem.id;

        await inventoryModuleService.createInventoryLevels([
          {
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: 1000,
          },
        ]);

        await link.create({
          // This core link's key alias is `variant_id`, not the generic
          // `product_variant_id` used by ProductModule.linkable.productVariant
          // elsewhere (confirmed against @medusajs/core-flows's own
          // dismiss-product-variants-inventory step, which is the sanctioned
          // reference for this exact link).
          [Modules.PRODUCT]: { variant_id: variantId },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
        });
      });

      /**
       * Creates a fresh pool + outcomes for a single test case, so the two
       * tests below don't share (and potentially race on) each other's rows.
       */
      async function createPool(
        outcomes: Array<{
          rarity_tier: string;
          rarity_color: string;
          weight: number;
          remaining_qty: number;
        }>
      ) {
        const container = getContainer();
        const mysteryPullModuleService = container.resolve(
          MYSTERY_PULL_MODULE
        ) as any;
        const link = container.resolve(ContainerRegistrationKeys.LINK);

        const pool = await mysteryPullModuleService.createPullPools({
          theme_key: `concurrency-test-${Date.now()}-${Math.random()}`,
          pack_art_url: null,
          is_active: true,
        });

        await link.create({
          [Modules.PRODUCT]: { product_id: productId },
          [MYSTERY_PULL_MODULE]: { pull_pool_id: pool.id },
        });

        const createdOutcomes = await mysteryPullModuleService.createPullOutcomes(
          outcomes.map((o) => ({
            pool_id: pool.id,
            rarity_tier: o.rarity_tier,
            rarity_color: o.rarity_color,
            weight: o.weight,
            linked_product_id: productId,
            linked_variant_id: variantId,
            remaining_qty: o.remaining_qty,
          }))
        );

        return { pool, outcomes: createdOutcomes };
      }

      it("lets only one of 5 concurrent draws win the last copy of the rarest outcome", async () => {
        const container = getContainer();
        const query = container.resolve(ContainerRegistrationKeys.QUERY);
        const mysteryPullModuleService = container.resolve(
          MYSTERY_PULL_MODULE
        ) as any;

        const { pool, outcomes } = await createPool([
          { rarity_tier: "Rare", rarity_color: "#e0a83f", weight: 1, remaining_qty: 1 },
          { rarity_tier: "Common", rarity_color: "#7fd68a", weight: 50, remaining_qty: 10 },
          { rarity_tier: "Uncommon", rarity_color: "#3b6eff", weight: 20, remaining_qty: 10 },
        ]);
        const rareOutcome = outcomes.find((o: any) => o.rarity_tier === "Rare");

        const settled = await Promise.allSettled(
          Array.from({ length: 5 }, () =>
            testAssignWorkflow(container).run({ input: { pool_id: pool.id } })
          )
        );

        // Total stock across all outcomes is 21 — comfortably more than 5
        // concurrent draws, so every call should succeed; none should hit
        // "sold out" in this scenario.
        const fulfilled = settled.filter(
          (s): s is PromiseFulfilledResult<any> => s.status === "fulfilled"
        );
        const rejected = settled.filter((s) => s.status === "rejected");
        expect(rejected).toHaveLength(0);
        expect(fulfilled).toHaveLength(5);

        const wonRareCount = fulfilled.filter(
          (s) => s.value.result.id === rareOutcome.id
        ).length;
        expect(wonRareCount).toBeLessThanOrEqual(1);

        // Every one of the 5 draws should have landed on a real, distinct
        // eligible tier (no duplicated/undefined outcome ids, no negative
        // remaining_qty anywhere).
        const { data: refreshedOutcomes } = await query.graph({
          entity: "pull_outcome",
          fields: ["id", "rarity_tier", "remaining_qty"],
          filters: { pool_id: pool.id } as any,
        });
        for (const outcome of refreshedOutcomes as any[]) {
          expect(outcome.remaining_qty).toBeGreaterThanOrEqual(0);
        }

        const rareRow = (refreshedOutcomes as any[]).find(
          (o) => o.id === rareOutcome.id
        );
        // Started at 1; only decrements if someone actually won it.
        expect(rareRow.remaining_qty).toBe(1 - wonRareCount);

        // Total remaining across the pool should have dropped by exactly 5
        // (one per successful draw), proving no draw was double-counted or
        // silently dropped.
        const totalRemaining = (refreshedOutcomes as any[]).reduce(
          (sum, o) => sum + o.remaining_qty,
          0
        );
        expect(totalRemaining).toBe(1 + 10 + 10 - 5);

        await mysteryPullModuleService.deletePullOutcomes(
          outcomes.map((o: any) => o.id)
        );
        await mysteryPullModuleService.deletePullPools([pool.id]);
      });

      it("fails gracefully instead of double-selling when concurrent demand exceeds total pool stock", async () => {
        const container = getContainer();
        const mysteryPullModuleService = container.resolve(
          MYSTERY_PULL_MODULE
        ) as any;

        // Only 3 units of stock in the whole pool, 5 concurrent callers.
        const { pool, outcomes } = await createPool([
          { rarity_tier: "Rare", rarity_color: "#e0a83f", weight: 1, remaining_qty: 1 },
          { rarity_tier: "Common", rarity_color: "#7fd68a", weight: 50, remaining_qty: 2 },
        ]);

        const settled = await Promise.allSettled(
          Array.from({ length: 5 }, () =>
            testAssignWorkflow(container).run({ input: { pool_id: pool.id } })
          )
        );

        const fulfilled = settled.filter((s) => s.status === "fulfilled");
        const rejected = settled.filter(
          (s): s is PromiseRejectedResult => s.status === "rejected"
        );

        // Exactly 3 of the 5 concurrent draws should succeed (total stock);
        // the other 2 should fail with a clear "sold out" error, not hang,
        // crash the process, or silently return a bad result.
        expect(fulfilled).toHaveLength(3);
        expect(rejected).toHaveLength(2);
        for (const failure of rejected) {
          expect(String(failure.reason?.message ?? failure.reason)).toMatch(
            /sold out/i
          );
        }

        // The pool should now be fully exhausted and deactivated.
        const { data: refreshedPools } = await container
          .resolve(ContainerRegistrationKeys.QUERY)
          .graph({
            entity: "pull_pool",
            fields: ["id", "is_active"],
            filters: { id: pool.id } as any,
          });
        expect((refreshedPools[0] as any).is_active).toBe(false);

        await mysteryPullModuleService.deletePullOutcomes(
          outcomes.map((o: any) => o.id)
        );
        await mysteryPullModuleService.deletePullPools([pool.id]);
      });
    });
  },
});
