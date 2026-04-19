import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  likes: integer("likes").notNull().default(0),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, likes: true, createdAt: true, approved: true });
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof commentsTable.$inferSelect;

export const commentTokensTable = pgTable("comment_tokens", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").notNull(),
  token: text("token").notNull(),
  action: text("action").notNull(),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CommentToken = typeof commentTokensTable.$inferSelect;

export const visitorsTable = pgTable("visitors", {
  id: serial("id").primaryKey(),
  count: integer("count").notNull().default(0),
});

export type Visitor = typeof visitorsTable.$inferSelect;

export const resumeDataTable = pgTable("resume_data", {
  id: serial("id").primaryKey(),
  data: text("data").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  sessionToken: text("session_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AdminSession = typeof adminSessionsTable.$inferSelect;
