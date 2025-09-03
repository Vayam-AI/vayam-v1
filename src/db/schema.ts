import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  real,
  smallint,
  jsonb,
  primaryKey,
  bigint,
} from "drizzle-orm/pg-core";

// Users table with timestamp instead of bigint
export const users = pgTable("users", {
  uid: serial("uid").primaryKey(),
  username: varchar("username", { length: 255 }).unique(),
  hname: varchar("hname", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  mobile: varchar("mobile", { length: 20 }).unique(),
  provider: varchar("provider", { length: 50 }).default("email"), // google, microsoft, email
  tags: text("tags").array().default([]),
  isEmailVerified: boolean("is_email_verified").default(false),
  isMobileVerified: boolean("is_mobile_verified").default(false),
  isHomeOnboardingDone: boolean("is_home_onboarding_done").default(false),
  isConversationsOnboardingDone: boolean(
    "is_conversations_onboarding_done"
  ).default(false),

  createdAt: timestamp("created_at").defaultNow(),
});

// Password hashes table
export const passwordHashes = pgTable("jianiuevyew", {
  uid: integer("uid")
    .references(() => users.uid)
    .notNull()
    .primaryKey(),
  pwhash: varchar("pwhash", { length: 128 }).notNull(),
});

// Auth tokens table
export const authTokens = pgTable("auth_tokens", {
  token: varchar("token", { length: 32 }).primaryKey(),
  uid: integer("uid").references(() => users.uid),
  created: timestamp("created").defaultNow(),
});

// Conversations table
export const conversations = pgTable("conversations", {
  zid: serial("zid").primaryKey(),
  topic: varchar("topic", { length: 1000 }),
  description: text("description"),
  linkUrl: varchar("link_url", { length: 9999 }),
  participantCount: integer("participant_count").default(0),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  strictModeration: boolean("strict_moderation").default(false),
  prioritizeSeed: boolean("prioritize_seed").default(false),
  useXidWhitelist: boolean("use_xid_whitelist").default(false),
  tags: text("tags").array().default([]),
  allowedEmails: text("allowed_emails").array().default([]),
  owner: integer("owner").references(() => users.uid),

  likeCount: integer("like_count").default(0),
  dislikeCount: integer("dislike_count").default(0),
  neutralCount: integer("neutral_count").default(0),
  commentsCount: integer("comments_count").default(0),

  logos: text("logos").array().default([]),
  infoImages: text("info_images").array().default([]),

  modified: timestamp("modified").defaultNow(),
  createdAt: bigint("created_at", { mode: "number" }).default(
    sql`EXTRACT(EPOCH FROM NOW()) * 1000`
  ),
});

// Zinvites table - stores invite codes for conversations
export const zinvites = pgTable("zinvites", {
  zid: integer("zid")
    .references(() => conversations.zid)
    .notNull(),
  zinvite: varchar("zinvite", { length: 300 }).notNull().primaryKey(),
  created: timestamp("created").defaultNow(),
});

// Participants table
export const participants = pgTable("participants", {
  pid: serial("pid").primaryKey(),
  uid: integer("uid")
    .references(() => users.uid)
    .notNull(),
  zid: integer("zid")
    .references(() => conversations.zid)
    .notNull(),
  voteCount: integer("vote_count").default(0),
  lastInteraction: bigint("last_interaction", { mode: "number" }).default(
    sql`0`
  ),
  subscribed: integer("subscribed").default(0),
  lastNotified: bigint("last_notified", { mode: "number" }).default(sql`0`),
  nsli: smallint("nsli").default(0),
  mod: integer("mod").default(0),
  created: timestamp("created").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  tid: serial("tid").primaryKey(),
  zid: integer("zid")
    .references(() => conversations.zid)
    .notNull(),
  pid: integer("pid")
    .references(() => participants.pid)
    .notNull(),
  uid: integer("uid")
    .references(() => users.uid)
    .notNull(),
  created: timestamp("created").defaultNow(),
  modified: timestamp("modified_at").defaultNow(),
  txt: varchar("txt").notNull(),
  velocity: real("velocity").default(1),
  mod: integer("mod").default(0),
  active: boolean("active").default(true),
  isMeta: boolean("is_meta").default(false),
  isSeed: boolean("is_seed").default(false),

  likeCount: integer("like_count").default(0),
  dislikeCount: integer("dislike_count").default(0),
  neutralCount: integer("neutral_count").default(0),

  flagStatus: text("flag_status").default("rejected"),
  flagReason: text("flag_reason").default(""),
});

// Reports table
export const reports = pgTable("reports", {
  rid: serial("rid").primaryKey(),
  reportId: varchar("report_id", { length: 300 }).notNull().unique(),
  zid: integer("zid")
    .references(() => conversations.zid)
    .notNull(),
  created: timestamp("created").defaultNow(),
  modified: timestamp("modified").defaultNow(),
  reportName: varchar("report_name", { length: 999 }),
  labelXNeg: varchar("label_x_neg", { length: 999 }),
  labelXPos: varchar("label_x_pos", { length: 999 }),
  labelYNeg: varchar("label_y_neg", { length: 999 }),
  labelYPos: varchar("label_y_pos", { length: 999 }),
  labelGroup0: varchar("label_group_0", { length: 999 }),
  labelGroup1: varchar("label_group_1", { length: 999 }),
  labelGroup2: varchar("label_group_2", { length: 999 }),
  labelGroup3: varchar("label_group_3", { length: 999 }),
  labelGroup4: varchar("label_group_4", { length: 999 }),
  labelGroup5: varchar("label_group_5", { length: 999 }),
  labelGroup6: varchar("label_group_6", { length: 999 }),
  labelGroup7: varchar("label_group_7", { length: 999 }),
  labelGroup8: varchar("label_group_8", { length: 999 }),
  labelGroup9: varchar("label_group_9", { length: 999 }),
});

// Report comment selections table
export const reportCommentSelections = pgTable(
  "report_comment_selections",
  {
    zid: integer("zid")
      .references(() => conversations.zid)
      .notNull(),
    rid: integer("rid")
      .references(() => reports.rid)
      .notNull(),
    tid: integer("tid").notNull(),
    selection: smallint("selection").notNull(),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rid, table.tid] }),
  })
);

// Worker tasks table
export const workerTasks = pgTable("worker_tasks", {
  created: timestamp("created").defaultNow(),
  mathEnv: varchar("math_env", { length: 999 }).notNull(),
  attempts: smallint("attempts").default(0),
  taskData: jsonb("task_data").notNull(),
  taskType: varchar("task_type", { length: 99 }),
  taskBucket: bigint("task_bucket", { mode: "number" }),
  finishedTime: bigint("finished_time", { mode: "number" }),
});

// Math ticks table
export const mathTicks = pgTable(
  "math_ticks",
  {
    zid: integer("zid").references(() => conversations.zid),
    mathTick: bigint("math_tick", { mode: "number" }).default(sql`0`),
    cachingTick: bigint("caching_tick", { mode: "number" }).default(sql`0`),
    mathEnv: varchar("math_env", { length: 999 }).notNull(),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zid, table.mathEnv] }),
  })
);

// Math main table
export const mathMain = pgTable(
  "math_main",
  {
    zid: integer("zid")
      .references(() => conversations.zid)
      .notNull(),
    mathEnv: varchar("math_env", { length: 999 }).notNull(),
    data: jsonb("data").notNull(),
    lastVoteTimestamp: bigint("last_vote_timestamp", {
      mode: "number",
    }).notNull(),
    cachingTick: bigint("caching_tick", { mode: "number" }).default(sql`0`),
    mathTick: bigint("math_tick", { mode: "number" }).default(sql`-1`),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zid, table.mathEnv] }),
  })
);

// Math participant stats table
export const mathPtptstats = pgTable(
  "math_ptptstats",
  {
    zid: integer("zid")
      .references(() => conversations.zid)
      .notNull(),
    mathEnv: varchar("math_env", { length: 999 }).notNull(),
    mathTick: bigint("math_tick", { mode: "number" }).default(sql`-1`),
    data: jsonb("data").notNull(),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zid, table.mathEnv] }),
  })
);

// Math bid to pid table
export const mathBidtopid = pgTable(
  "math_bidtopid",
  {
    zid: integer("zid")
      .references(() => conversations.zid)
      .notNull(),
    mathEnv: varchar("math_env", { length: 999 }).notNull(),
    mathTick: bigint("math_tick", { mode: "number" }).default(sql`-1`),
    data: jsonb("data").notNull(),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zid, table.mathEnv] }),
  })
);

// Math report correlation matrix table
export const mathReportCorrelationmatrix = pgTable(
  "math_report_correlationmatrix",
  {
    rid: integer("rid")
      .references(() => reports.rid)
      .notNull(),
    mathEnv: varchar("math_env", { length: 999 }).notNull(),
    data: jsonb("data"),
    mathTick: bigint("math_tick", { mode: "number" }).default(sql`-1`),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rid, table.mathEnv] }),
  })
);

// Votes table
export const votes = pgTable(
  "votes",
  {
    zid: integer("zid").notNull(),
    pid: integer("pid").notNull(),
    tid: integer("tid").notNull(),
    uid: integer("uid").notNull(),
    vote: smallint("vote"),
    weightX32767: smallint("weight_x_32767").default(0),
    created: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.zid, table.tid, table.uid] }),
    };
  }
);

// Votes latest unique table
export const votesLatestUnique = pgTable(
  "votes_latest_unique",
  {
    zid: integer("zid").notNull(),
    pid: integer("pid").notNull(),
    tid: integer("tid").notNull(),
    vote: smallint("vote"),
    weightX32767: smallint("weight_x_32767").default(0),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zid, table.pid, table.tid] }),
  })
);

// Event participant no more comments table
export const eventPtptNoMoreComments = pgTable("event_ptpt_no_more_comments", {
  zid: integer("zid").notNull(),
  pid: integer("pid").notNull(),
  votesPlaced: smallint("votes_placed").notNull(),
  created: timestamp("created").defaultNow(),
});

// Notification tasks table
export const notificationTasks = pgTable("notification_tasks", {
  zid: integer("zid")
    .references(() => conversations.zid)
    .notNull()
    .primaryKey(),
  modified: timestamp("modified").defaultNow(),
});

// Math export status table
export const mathExportstatus = pgTable(
  "math_exportstatus",
  {
    zid: integer("zid")
      .references(() => conversations.zid)
      .notNull(),
    mathEnv: varchar("math_env", { length: 999 }).notNull(),
    filename: varchar("filename", { length: 9999 }).notNull(),
    data: jsonb("data").notNull(),
    modified: timestamp("modified").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.zid, table.mathEnv] }),
  })
);

// starred table
export const starred = pgTable(
  "starred",
  {
    uid: integer("uid").references(() => users.uid),
    tid: integer("tid"),
    created: timestamp("created").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.uid, table.tid] }),
  })
);

// subscribed table
export const subscribed = pgTable(
  "subscribed",
  {
    uid: integer("uid").references(() => users.uid),
    zid: integer("zid"),
    created: timestamp("created").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.uid, table.zid] }),
  })
);
