import { pgTable, text, timestamp, boolean, date, time } from "drizzle-orm/pg-core";

export const availabilitySlots = pgTable("availability_slots", {
  id: text("id").primaryKey(),
  providerCompanyId: text("provider_company_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  notes: text("notes"),
  isBooked: boolean("is_booked").default(false).notNull(),
  bookedByWorkOrderId: text("booked_by_work_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type NewAvailabilitySlot = typeof availabilitySlots.$inferInsert;
