import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260919212338 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "card_detail" alter column "grade" type real using ("grade"::real);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "card_detail" alter column "grade" type integer using ("grade"::integer);`);
  }

}
