import { pgTable, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  requesterCompanyId: text("requester_company_id").notNull(),
  providerCompanyId: text("provider_company_id").notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  travelCost: numeric("travel_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  finalPrice: numeric("final_price", { precision: 12, scale: 2 }).notNull(),
  providerReceivable: numeric("provider_receivable", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  requesterCompanyId: text("requester_company_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentInvoices = pgTable("payment_invoices", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id").notNull(),
  invoiceId: text("invoice_id").notNull(),
});

export const payouts = pgTable("payouts", {
  id: text("id").primaryKey(),
  providerCompanyId: text("provider_company_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payoutWorkOrders = pgTable("payout_work_orders", {
  id: text("id").primaryKey(),
  payoutId: text("payout_id").notNull(),
  workOrderId: text("work_order_id").notNull(),
});

export const commissionLedger = pgTable("commission_ledger", {
  id: text("id").primaryKey(),
  workOrderId: text("work_order_id").notNull(),
  invoiceId: text("invoice_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commissionSettings = pgTable("commission_settings", {
  id: text("id").primaryKey().default("default"),
  defaultRate: numeric("default_rate", { precision: 5, scale: 2 }).notNull().default("15"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const travelPricingRules = pgTable("travel_pricing_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(),
  matchValue: text("match_value").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type TravelPricingRule = typeof travelPricingRules.$inferSelect;
export type CommissionSetting = typeof commissionSettings.$inferSelect;
