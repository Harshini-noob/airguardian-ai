import { pgTable, serial, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wardTable = pgTable("wards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  population: integer("population").notNull().default(0),
  landUseType: text("land_use_type").notNull().default("mixed"),
});

export const insertWardSchema = createInsertSchema(wardTable).omit({ id: true });
export type InsertWard = z.infer<typeof insertWardSchema>;
export type Ward = typeof wardTable.$inferSelect;

export const aqiReadingTable = pgTable("aqi_readings", {
  id: serial("id").primaryKey(),
  wardId: integer("ward_id").notNull().references(() => wardTable.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  aqiValue: integer("aqi_value").notNull(),
  pm25: real("pm25").notNull(),
  pm10: real("pm10").notNull(),
  no2: real("no2").notNull(),
  so2: real("so2").notNull(),
  co: real("co").notNull(),
  source: text("source").notNull().default("mock"),
});

export const insertAqiReadingSchema = createInsertSchema(aqiReadingTable).omit({ id: true });
export type InsertAqiReading = z.infer<typeof insertAqiReadingSchema>;
export type AqiReading = typeof aqiReadingTable.$inferSelect;
