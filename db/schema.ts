import {
  int,
  mysqlTable,
  varchar,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  login_method: varchar("login_method", { length: 256 })
    .notNull()
    .default("Password"),
  google_id: varchar("google_id", { length: 256 }),
  password_hash: varchar("password_hash", { length: 256 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const reset_password = mysqlTable("reset_password", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id")
    .references(() => users.id)
    .notNull(),
  code: varchar("code", { length: 256 }).notNull().unique(),
  expiration_time: timestamp("expiration_time").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const classrooms = mysqlTable("classrooms", {
  id: varchar("id", { length: 256 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: varchar("description", { length: 512 }),
  created_by: int("created_by")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const classroom_roles = mysqlTable(
  "classroom_roles",
  {
    classroom_id: varchar("classroom_id", { length: 256 }),
    user_id: int("user_id").references(() => users.id),
    role: varchar("role", { length: 256 }).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.classroom_id, table.user_id] }),
    };
  }
);

export const classroom_invites = mysqlTable("classroom_invites", {
  classroom_id: varchar("classroom_id", { length: 256 }).references(
    () => classrooms.id
  ),
  code: varchar("code", { length: 256 }).notNull().unique().primaryKey(),
  created_by: int("created_by").references(() => users.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const assignments = mysqlTable("assignments", {
  id: int("id").primaryKey().autoincrement(),
  classroom_id: varchar("classroom_id", { length: 256 }).references(
    () => classrooms.id
  ),
  name: varchar("name", { length: 256 }).notNull(),
  description: varchar("description", { length: 512 }),
  possible_marks: int("possible_marks"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  due_at: timestamp("due_at"),
});

export const assignment_submissions = mysqlTable("assignment_submissions", {
  id: int("id").primaryKey().autoincrement(),
  assignment_id: int("assignment_id").references(() => assignments.id),
  user_id: int("user_id").references(() => users.id),
  submitted_at: timestamp("submitted_at"),
  grade: int("grade"),
  graded_at: timestamp("graded_at"),
});

export const ai_materials = mysqlTable("ai_materials", {
  id: int("id").primaryKey().autoincrement(),
  document_key: text("document_key").notNull(),
  response: text("response").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
