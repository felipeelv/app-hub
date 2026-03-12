import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workOrders = pgTable("work_orders", {
  id: text("id").primaryKey(),
  requesterCompanyId: text("requester_company_id").notNull(),
  providerCompanyId: text("provider_company_id"),
  serviceCatalogItemId: text("service_catalog_item_id"),
  serviceName: text("service_name").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  notes: text("notes"),
  cep: text("cep"),
  status: text("status").notNull().default("requested"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }),
  travelCost: numeric("travel_cost", { precision: 12, scale: 2 }).default("0"),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).default("0"),
  finalPrice: numeric("final_price", { precision: 12, scale: 2 }),
  providerReceivable: numeric("provider_receivable", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workOrderStatusHistory = pgTable("work_order_status_history", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  status: text("status").notNull(),
  note: text("note"),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  changedBy: text("changed_by").notNull(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WorkOrder = typeof workOrders.$inferSelect;
export type WorkOrderStatusHistory = typeof workOrderStatusHistory.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
