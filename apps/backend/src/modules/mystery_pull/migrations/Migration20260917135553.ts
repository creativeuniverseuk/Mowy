import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260917135553 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pull_outcome" ("id" text not null, "pool_id" text not null, "rarity_tier" text not null, "rarity_color" text not null, "weight" integer not null, "linked_product_id" text not null, "linked_variant_id" text null, "remaining_qty" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pull_outcome_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pull_outcome_deleted_at" ON "pull_outcome" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pull_pool" ("id" text not null, "theme_key" text not null, "pack_art_url" text null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pull_pool_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pull_pool_deleted_at" ON "pull_pool" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pull_outcome" cascade;`);

    this.addSql(`drop table if exists "pull_pool" cascade;`);
  }

}
