import { pgTable, text, integer, primaryKey, doublePrecision, index, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// ============================================================================
// Auth.js core tables (required by @auth/drizzle-adapter)
// ============================================================================

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  passwordHash: text("password_hash"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  aiSourcingEnabled: boolean("ai_sourcing_enabled").notNull().default(true),
  // Per-user BOM column preferences: { order: string[], hidden: string[] }
  columnPrefs: jsonb("column_prefs").$type<{ order: string[]; hidden: string[] }>(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const accountTokens = pgTable(
  "account_token",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["email_verification", "password_reset"] }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("account_token_user_idx").on(t.userId),
    typeIdx: index("account_token_type_idx").on(t.type),
  })
);

// ============================================================================
// AUTBOM domain tables
// ============================================================================

export const teams = pgTable("team", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const teamMembers = pgTable(
  "team_member",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["owner", "admin", "member", "validator", "buyer", "viewer"],
    })
      .notNull()
      .default("member"),
    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.teamId, t.userId] }),
  })
);

export const teamInvites = pgTable(
  "team_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role", {
      enum: ["admin", "member", "validator", "buyer", "viewer"],
    })
      .notNull()
      .default("member"),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    teamIdx: index("team_invite_team_idx").on(t.teamId),
    emailIdx: index("team_invite_email_idx").on(t.email),
  })
);

export const projects = pgTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const projectMembers = pgTable(
  "project_member",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["designer", "validator", "buyer_small", "buyer_big", "admin"],
    })
      .notNull()
      .default("designer"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
  })
);

export const suppliers = pgTable("supplier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  website: text("website"),
  defaultShippingHT: doublePrecision("default_shipping_ht"),
  // Identifier matching KNOWN_SUPPLIER_SITES in @autbom/shared (tolery, amazon, ...)
  // Used by the browser extension to know which content script to invoke.
  knownSite: text("known_site"),
  notes: text("notes"),
});

export const boms = pgTable(
  "bom",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", {
      enum: ["draft", "submitted", "approved", "rejected", "ordered", "delivered"],
    })
      .notNull()
      .default("draft"),
    currentVersion: integer("current_version").notNull().default(1),
    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow(),
    // Per-BOM custom column definitions
    customColumns: jsonb("custom_columns")
      .$type<{ key: string; label: string; type: "text" | "number" }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
  },
  (t) => ({
    projectIdx: index("bom_project_idx").on(t.projectId),
  })
);

export const bomLines = pgTable(
  "bom_line",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bomId: text("bom_id")
      .notNull()
      .references(() => boms.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    designation: text("designation").notNull(),
    qty: doublePrecision("qty").notNull().default(1),
    material: text("material"),
    supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    supplierRef: text("supplier_ref"),
    productUrl: text("product_url"),
    unitPriceHT: doublePrecision("unit_price_ht"),
    tva: doublePrecision("tva"),
    leadTimeDays: integer("lead_time_days"),
    notes: text("notes"),
    status: text("status", {
      enum: ["to_source", "to_validate", "validated", "ordered", "received", "cancelled"],
    })
      .notNull()
      .default("to_source"),
    // Values for BOM custom columns: { [colKey]: string | number | null }
    customValues: jsonb("custom_values")
      .$type<Record<string, string | number | null>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (t) => ({
    bomIdx: index("bom_line_bom_idx").on(t.bomId),
  })
);

export const bomVersions = pgTable("bom_version", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bomId: text("bom_id")
    .notNull()
    .references(() => boms.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  // JSON snapshot of BomLine[] at submit time
  snapshot: text("snapshot").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const attachments = pgTable(
  "attachment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bomLineId: text("bom_line_id")
      .notNull()
      .references(() => bomLines.id, { onDelete: "cascade" }),
    type: text("type", {
      enum: ["dxf", "step", "stp", "stl", "3mf", "pdf", "image", "url", "other"],
    })
      .notNull()
      .default("other"),
    name: text("name").notNull(),
    // Either a storage key (fs/s3) or an external URL.
    url: text("url").notNull(),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    lineIdx: index("attachment_line_idx").on(t.bomLineId),
  })
);

export const validations = pgTable("validation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bomId: text("bom_id")
    .notNull()
    .references(() => boms.id, { onDelete: "cascade" }),
  validatorId: text("validator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  decision: text("decision", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  comment: text("comment"),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at"),
});

export const cartBatches = pgTable("cart_batch", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bomId: text("bom_id")
    .notNull()
    .references(() => boms.id, { onDelete: "cascade" }),
  supplierId: text("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["draft", "ready", "opened", "filled", "ordered", "cancelled"],
  })
    .notNull()
    .default("draft"),
  totalHT: doublePrecision("total_ht").notNull().default(0),
  totalTTC: doublePrecision("total_ttc").notNull().default(0),
  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow(),
});

export const cartBatchLines = pgTable(
  "cart_batch_line",
  {
    cartBatchId: text("cart_batch_id")
      .notNull()
      .references(() => cartBatches.id, { onDelete: "cascade" }),
    bomLineId: text("bom_line_id")
      .notNull()
      .references(() => bomLines.id, { onDelete: "cascade" }),
    qty: doublePrecision("qty").notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.cartBatchId, t.bomLineId] }),
  })
);

// ============================================================================
// Relations
// ============================================================================

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  members: many(projectMembers),
  boms: many(boms),
}));

export const bomsRelations = relations(boms, ({ one, many }) => ({
  project: one(projects, { fields: [boms.projectId], references: [projects.id] }),
  lines: many(bomLines),
  versions: many(bomVersions),
  validations: many(validations),
  cartBatches: many(cartBatches),
}));

export const bomLinesRelations = relations(bomLines, ({ one, many }) => ({
  bom: one(boms, { fields: [bomLines.bomId], references: [boms.id] }),
  supplier: one(suppliers, { fields: [bomLines.supplierId], references: [suppliers.id] }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  line: one(bomLines, { fields: [attachments.bomLineId], references: [bomLines.id] }),
}));

export const cartBatchesRelations = relations(cartBatches, ({ one, many }) => ({
  bom: one(boms, { fields: [cartBatches.bomId], references: [boms.id] }),
  supplier: one(suppliers, { fields: [cartBatches.supplierId], references: [suppliers.id] }),
  lines: many(cartBatchLines),
}));

