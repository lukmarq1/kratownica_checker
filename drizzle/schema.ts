import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const ipBlacklist = mysqlTable("ip_blacklist", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull().unique(),
  reason: text("reason"),
  manuallyUnlocked: int("manuallyUnlocked").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IpBlacklist = typeof ipBlacklist.$inferSelect;
export type InsertIpBlacklist = typeof ipBlacklist.$inferInsert;

export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * IP-based attempt tracking for angle verification.
 * Stores failed attempts and lockout timestamps per IP address.
 */
export const angleAttempts = mysqlTable("angle_attempts", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull().unique(),
  failedAttempts: int("failedAttempts").notNull().default(0),
  lastAttemptAt: timestamp("lastAttemptAt").defaultNow().notNull(),
  lockedUntil: timestamp("lockedUntil"),
  isRepeatedOffender: int("isRepeatedOffender").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AngleAttempt = typeof angleAttempts.$inferSelect;
export type InsertAngleAttempt = typeof angleAttempts.$inferInsert;

/**
 * Detailed history of all angle verification attempts.
 * Used for admin dashboard to track all submissions.
 */
export const attemptHistory = mysqlTable("attempt_history", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  angle: varchar("angle", { length: 10 }).notNull(),
  isCorrect: int("isCorrect").notNull(),
  attemptNumber: int("attemptNumber").notNull(),
  userAgent: text("userAgent"),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  isp: varchar("isp", { length: 100 }),
  browserFamily: varchar("browserFamily", { length: 50 }),
  osFamily: varchar("osFamily", { length: 50 }),
  deviceType: varchar("deviceType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttemptHistory = typeof attemptHistory.$inferSelect;
export type InsertAttemptHistory = typeof attemptHistory.$inferInsert;

/**
 * Advanced user profile tracking for repeat offender identification.
 * Stores aggregated stats and device fingerprinting per IP.
 */
export const userDeviceProfiles = mysqlTable("user_device_profiles", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull().unique(),
  totalAttempts: int("totalAttempts").notNull().default(0),
  successfulAttempts: int("successfulAttempts").notNull().default(0),
  failedAttempts: int("failedAttempts").notNull().default(0),
  successRate: varchar("successRate", { length: 10 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  isp: varchar("isp", { length: 100 }),
  browserFamily: varchar("browserFamily", { length: 50 }),
  osFamily: varchar("osFamily", { length: 50 }),
  deviceType: varchar("deviceType", { length: 50 }),
  userAgents: text("userAgents"),
  lastAttemptAt: timestamp("lastAttemptAt"),
  firstAttemptAt: timestamp("firstAttemptAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDeviceProfile = typeof userDeviceProfiles.$inferSelect;
export type InsertUserDeviceProfile = typeof userDeviceProfiles.$inferInsert;