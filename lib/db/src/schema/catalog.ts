import { pgTable, text, timestamp, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceCatalogItems = pgTable("service_catalog_items", {
  id: text("id").primaryKey(),
  providerCompanyId: text("provider_company_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  estimatedDays: integer("estimated_days"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  regions: text("regions").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCatalogItemSchema = createInsertSchema(serviceCatalogItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ServiceCatalogItem = typeof serviceCatalogItems.$inferSelect;
export type InsertCatalogItem = z.infer<typeof insertCatalogItemSchema>;
