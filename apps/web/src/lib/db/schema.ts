import { sqliteTable, text, integer, primaryKey, real, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// ============================================================================
// Auth.js core tables (required by @auth/drizzle-adapter)
// ============================================================================

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
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

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ============================================================================
// AUTBOM domain tables
// ============================================================================

export const projects = sqliteTable("project", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const projectMembers = sqliteTable(
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

export const suppliers = sqliteTable("supplier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  website: text("website"),
  defaultShippingHT: real("default_shipping_ht"),
  // Identifier matching KNOWN_SUPPLIER_SITES in @autbom/shared (tolery, amazon, ...)
  // Used by the browser extension to know which content script to invoke.
  knownSite: text("known_site"),
  notes: text("notes"),
});

export const boms = sqliteTable(
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
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    projectIdx: index("bom_project_idx").on(t.projectId),
  })
);

export const bomLines = sqliteTable(
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
    qty: real("qty").notNull().default(1),
    material: text("material"),
    supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    supplierRef: text("supplier_ref"),
    productUrl: text("product_url"),
    unitPriceHT: real("unit_price_ht"),
    tva: real("tva"),
    leadTimeDays: integer("lead_time_days"),
    notes: text("notes"),
    status: text("status", {
      enum: ["to_source", "to_validate", "validated", "ordered", "received", "cancelled"],
    })
      .notNull()
      .default("to_source"),
  },
  (t) => ({
    bomIdx: index("bom_line_bom_idx").on(t.bomId),
  })
);

export const bomVersions = sqliteTable("bom_version", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bomId: text("bom_id")
    .notNull()
    .references(() => boms.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  // JSON snapshot of BomLine[] at submit time
  snapshot: text("snapshot").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const attachments = sqliteTable(
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
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    lineIdx: index("attachment_line_idx").on(t.bomLineId),
  })
);

export const validations = sqliteTable("validation", {
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
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  decidedAt: integer("decided_at", { mode: "timestamp_ms" }),
});

export const cartBatches = sqliteTable("cart_batch", {
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
  totalHT: real("total_ht").notNull().default(0),
  totalTTC: real("total_ttc").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const cartBatchLines = sqliteTable(
  "cart_batch_line",
  {
    cartBatchId: text("cart_batch_id")
      .notNull()
      .references(() => cartBatches.id, { onDelete: "cascade" }),
    bomLineId: text("bom_line_id")
      .notNull()
      .references(() => bomLines.id, { onDelete: "cascade" }),
    qty: real("qty").notNull().default(1),
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
