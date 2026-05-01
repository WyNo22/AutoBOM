// Domain types shared between web app and extension.
// Keep this file framework-free (no React, no Next, no DB imports).

export type UserRole =
  | "designer"
  | "validator"
  | "buyer_small" // achats <= 250€ (carte directe sur site)
  | "buyer_big" // achats > 250€ (handoff Notion, hors MVP)
  | "admin";

export type BomStatus = "draft" | "submitted" | "approved" | "rejected" | "ordered" | "delivered";

export type BomLineStatus =
  | "to_source"
  | "to_validate"
  | "validated"
  | "ordered"
  | "received"
  | "cancelled";

export type ValidationDecision = "pending" | "approved" | "rejected";

export type CartBatchStatus =
  | "draft"
  | "ready"
  | "opened" // onglets ouverts / extension a reçu la liste
  | "filled" // panier rempli sur le site
  | "ordered" // commande passée
  | "cancelled";

export type AttachmentType = "dxf" | "step" | "stp" | "stl" | "3mf" | "pdf" | "image" | "url" | "other";

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string; // ISO
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: UserRole;
}

export interface Supplier {
  id: string;
  name: string;
  website: string | null;
  defaultShippingHT: number | null;
  notes: string | null;
}

export interface Bom {
  id: string;
  projectId: string;
  name: string;
  status: BomStatus;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface BomLine {
  id: string;
  bomId: string;
  position: number;
  designation: string;
  qty: number;
  material: string | null;
  supplierId: string | null;
  supplierRef: string | null;
  productUrl: string | null;
  unitPriceHT: number | null;
  tva: number | null; // 0.20 etc.
  leadTimeDays: number | null;
  notes: string | null;
  status: BomLineStatus;
}

export interface BomVersion {
  id: string;
  bomId: string;
  versionNumber: number;
  snapshot: string; // JSON-serialized BomLine[]
  createdAt: string;
  createdById: string;
}

export interface Attachment {
  id: string;
  bomLineId: string;
  type: AttachmentType;
  name: string;
  url: string; // either external URL or storage key
  sizeBytes: number | null;
  createdAt: string;
}

export interface Validation {
  id: string;
  bomId: string;
  validatorId: string;
  decision: ValidationDecision;
  comment: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface CartBatch {
  id: string;
  bomId: string;
  supplierId: string;
  status: CartBatchStatus;
  totalHT: number;
  totalTTC: number;
  createdAt: string;
}

export interface CartBatchLine {
  cartBatchId: string;
  bomLineId: string;
  qty: number;
}

// Site identifiers known by the browser extension.
export const KNOWN_SUPPLIER_SITES = [
  "tolery",
  "xometry",
  "amazon",
  "misumi",
  "rs",
  "leroymerlin",
  "bricovis",
  "123roulements",
  "norelem",
] as const;
export type KnownSupplierSite = (typeof KNOWN_SUPPLIER_SITES)[number];

/**
 * Payload sent by a content script to the background worker
 * when the user clicks "Capturer" on a product page.
 */
export interface CapturedProduct {
  designation: string;
  supplierRef?: string;
  productUrl: string;
  unitPriceHT?: number;
  qty?: number;
  notes?: string;
  supplierName: string;
  site: KnownSupplierSite;
}
