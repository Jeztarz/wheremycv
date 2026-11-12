import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** ผู้ใช้ 1 คน = LINE userId 1 อัน */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // LINE userId (U…)
  displayName: text("display_name").notNull().default(""),
  pictureUrl: text("picture_url"),
  followDays: integer("follow_days").notNull().default(14),
  ghostDays: integer("ghost_days").notNull().default(30),
  soonDays: integer("soon_days").notNull().default(1),
  lineNotify: integer("line_notify", { mode: "boolean" }).notNull().default(true),
  notifyHour: integer("notify_hour").notNull().default(8),
  lastNotifiedOn: text("last_notified_on"), // YYYY-MM-DD (เวลาไทย) กันส่งซ้ำ
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/** การสมัครงาน 1 ตำแหน่ง = 1 การ์ด */
export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    position: text("position").notNull(),
    appliedOn: text("applied_on").notNull(), // YYYY-MM-DD
    channel: text("channel"),
    jobUrl: text("job_url"),
    salaryExpected: text("salary_expected"),
    salaryOffered: text("salary_offered"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    note: text("note"),
    // คำนวณจาก events แล้วเก็บไว้เพื่อ query เร็ว (ดู lib/status.ts)
    status: text("status").notNull().default("sent"),
    lastActivityOn: text("last_activity_on").notNull(),
    snoozedUntil: text("snoozed_until"), // YYYY-MM-DD ปิดเตือนถึงวันนี้
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("applications_user_idx").on(t.userId)],
);

/** เหตุการณ์ใน timeline ของแต่ละการสมัคร */
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // ดู EVENT_TYPES ใน lib/status.ts
    occurredOn: text("occurred_on").notNull(), // YYYY-MM-DD
    atTime: text("at_time"), // HH:MM
    round: integer("round"),
    mode: text("mode"), // onsite | online
    location: text("location"),
    note: text("note"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [
    index("events_application_idx").on(t.applicationId),
    index("events_user_date_idx").on(t.userId, t.occurredOn),
  ],
);

export type User = typeof users.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type AppEvent = typeof events.$inferSelect;

/** บริษัทที่ไม่อยากสมัครอีก */
export const blacklist = sqliteTable(
  "blacklist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    companyKey: text("company_key").notNull(), // ชื่อที่ normalize แล้ว (lib/company.ts)
    reason: text("reason"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("blacklist_user_company_idx").on(t.userId, t.companyKey)],
);

export type BlacklistEntry = typeof blacklist.$inferSelect;
