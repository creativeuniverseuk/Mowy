import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260918212457 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "pull_assignment" drop constraint if exists "pull_assignment_line_item_id_unique";`);
    this.addSql(`create table if not exists "pull_assignment" ("id" text not null, "line_item_id" text not null, "pool_id" text not null, "outcome_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pull_assignment_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pull_assignment_line_item_id_unique" ON "pull_assignment" ("line_item_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pull_assignment_deleted_at" ON "pull_assignment" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pull_assignment" cascade;`);
  }

}
