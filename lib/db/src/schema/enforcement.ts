import { pgTable, serial, integer, real, text, json, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { wardTable } from "./wards";

export const enforcementStatusEnum = pgEnum("enforcement_status", ["pending", "dispatched", "resolved"]);

export const enforcementActionTable = pgTable("enforcement_actions", {
  id: serial("id").primaryKey(),
  wardId: integer("ward_id").notNull().references(() => wardTable.id),
  priorityScore: real("priority_score").notNull(),
  sourceType: text("source_type").notNull(),
  recommendationText: text("recommendation_text").notNull(),
  evidenceJson: json("evidence_json").$type<string[]>().notNull().default([]),
  status: enforcementStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEnforcementSchema = createInsertSchema(enforcementActionTable).omit({ id: true });
export type InsertEnforcement = z.infer<typeof insertEnforcementSchema>;
export type EnforcementAction = typeof enforcementActionTable.$inferSelect;

export const advisoryTable = pgTable("advisories", {
  id: serial("id").primaryKey(),
  wardId: integer("ward_id").notNull().references(() => wardTable.id),
  language: text("language").notNull().default("en"),
  riskLevel: text("risk_level").notNull().default("moderate"),
  messageText: text("message_text").notNull(),
  vulnerableGroups: json("vulnerable_groups").$type<string[]>().notNull().default([]),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertAdvisorySchema = createInsertSchema(advisoryTable).omit({ id: true });
export type InsertAdvisory = z.infer<typeof insertAdvisorySchema>;
export type Advisory = typeof advisoryTable.$inferSelect;
