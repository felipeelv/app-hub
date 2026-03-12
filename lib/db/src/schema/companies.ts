import { pgTable, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const requesterCompanies = pgTable("requester_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  cep: text("cep"),
  city: text("city"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const providerCompanies = pgTable("provider_companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  cep: text("cep"),
  city: text("city"),
  state: text("state"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminProfiles = pgTable("admin_profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mockProfiles = pgTable("mock_profiles", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  companyId: text("company_id").notNull(),
  companyName: text("company_name").notNull(),
});

export const insertRequesterCompanySchema = createInsertSchema(requesterCompanies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProviderCompanySchema = createInsertSchema(providerCompanies).omit({ id: true, createdAt: true, updatedAt: true });

export type RequesterCompany = typeof requesterCompanies.$inferSelect;
export type ProviderCompany = typeof providerCompanies.$inferSelect;
export type AdminProfile = typeof adminProfiles.$inferSelect;
export type MockProfile = typeof mockProfiles.$inferSelect;
export type InsertRequesterCompany = z.infer<typeof insertRequesterCompanySchema>;
export type InsertProviderCompany = z.infer<typeof insertProviderCompanySchema>;
