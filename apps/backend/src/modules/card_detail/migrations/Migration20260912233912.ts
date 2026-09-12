import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260912233912 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "card_detail" ("id" text not null, "card_set" text not null, "rarity" text not null, "condition" text not null, "is_graded" boolean not null default false, "grading_company" text null, "grade" integer null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "card_detail_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_card_detail_deleted_at" ON "card_detail" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "card_detail" cascade;`);
  }

}
