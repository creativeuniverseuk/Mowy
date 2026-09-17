import { model } from "@medusajs/framework/utils";

const PullPool = model.define("pull_pool", {
  id: model.id().primaryKey(),
  theme_key: model.text(),
  pack_art_url: model.text().nullable(),
  is_active: model.boolean().default(true),
});

export default PullPool;
