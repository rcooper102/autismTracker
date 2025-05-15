import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for both practitioners and clients
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("client"), // 'practitioner' or 'client'
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client information schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  practitionerId: integer("practitioner_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  diagnosis: text("diagnosis"),
  guardianName: text("guardian_name"),
  guardianRelation: text("guardian_relation"),
  guardianPhone: text("guardian_phone"),
  guardianEmail: text("guardian_email"),
  treatmentPlan: json("treatment_plan").default([]),
  treatmentGoals: json("treatment_goals").default([]),
  avatarUrl: text("avatar_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client data entries schema
export const dataEntries = pgTable("data_entries", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  mood: text("mood").notNull(),
  anxietyLevel: integer("anxiety_level"), // 1-5
  sleepQuality: integer("sleep_quality"), // 1-5
  challenges: json("challenges").default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sessions schema for future appointments
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  practitionerId: integer("practitioner_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client notes schema for tracking client notes
export const clientNotes = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  title: text("title").notNull(),
  entries: jsonb("entries").default([]).notNull(), // Array of {text: string, date: timestamp}
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertDataEntrySchema = createInsertSchema(dataEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertClientNoteSchema = createInsertSchema(clientNotes).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// Relation definitions
export const usersRelations = relations(users, ({ many }) => ({
  clientsAsUser: many(clients, { relationName: "user_clients" }),
  clientsAsPractitioner: many(clients, { relationName: "practitioner_clients" }),
  sessions: many(sessions)
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
    relationName: "user_clients"
  }),
  practitioner: one(users, {
    fields: [clients.practitionerId],
    references: [users.id],
    relationName: "practitioner_clients"
  }),
  dataEntries: many(dataEntries),
  sessions: many(sessions),
  clientNotes: many(clientNotes)
}));

export const dataEntriesRelations = relations(dataEntries, ({ one }) => ({
  client: one(clients, {
    fields: [dataEntries.clientId],
    references: [clients.id]
  })
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  client: one(clients, {
    fields: [sessions.clientId],
    references: [clients.id]
  }),
  practitioner: one(users, {
    fields: [sessions.practitionerId],
    references: [users.id]
  })
}));

export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, {
    fields: [clientNotes.clientId],
    references: [clients.id]
  })
}));

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertDataEntry = z.infer<typeof insertDataEntrySchema>;
export type DataEntry = typeof dataEntries.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;
export type ClientNote = typeof clientNotes.$inferSelect;

// Extended types for the application
export type ClientWithUser = Client & {
  user: User;
};

export type DataEntryWithClient = DataEntry & {
  client: Client;
};
