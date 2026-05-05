import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Storage abstraction. Two drivers:
 *  - "fs" (default, dev): writes under STORAGE_FS_DIR
 *  - "supabase" (prod): writes to Supabase Storage.
 *
 * Returned `key` is what we persist in DB; `getUrl(key)` resolves it for the UI.
 */

export interface PutResult {
  key: string;
  sizeBytes: number;
}

export interface StorageDriver {
  put(filename: string, data: Buffer | Uint8Array): Promise<PutResult>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}

class FsDriver implements StorageDriver {
  constructor(private root: string) {}

  async put(filename: string, data: Buffer | Uint8Array): Promise<PutResult> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${randomUUID()}-${safeName}`;
    const full = path.join(this.root, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    const stat = await fs.stat(full);
    return { key, sizeBytes: stat.size };
  }

  getUrl(key: string): string {
    // Served by the API route /api/files/[key]
    return `/api/files/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const full = path.join(this.root, key);
    await fs.rm(full, { force: true });
  }
}

class SupabaseDriver implements StorageDriver {
  private client = createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  );

  constructor(private bucket: string) {
    if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required for Supabase storage.");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Supabase storage.");
    }
    if (!bucket) {
      throw new Error("SUPABASE_STORAGE_BUCKET or AVATAR_BUCKET is required for Supabase storage.");
    }
  }

  async put(filename: string, data: Buffer | Uint8Array): Promise<PutResult> {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${randomUUID()}-${safeName}`;
    const { error } = await this.client.storage.from(this.bucket).upload(key, data, {
      upsert: false,
      contentType: contentTypeOf(safeName),
    });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return { key, sizeBytes: data.byteLength };
  }

  getUrl(key: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  async delete(key: string): Promise<void> {
    const normalized = this.extractKey(key);
    if (!normalized) return;
    const { error } = await this.client.storage.from(this.bucket).remove([normalized]);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  }

  private extractKey(value: string): string | null {
    try {
      if (!value.startsWith("http")) return value;
      const url = new URL(value);
      const marker = `/storage/v1/object/public/${this.bucket}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(url.pathname.slice(idx + marker.length));
    } catch {
      return value;
    }
  }
}

function contentTypeOf(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "pdf") return "application/pdf";
  return "application/octet-stream";
}

let _driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (_driver) return _driver;
  const driver = process.env.STORAGE_DRIVER ?? "fs";
  if (driver === "fs") {
    _driver = new FsDriver(process.env.STORAGE_FS_DIR ?? "./storage");
    return _driver;
  }
  if (driver === "supabase") {
    _driver = new SupabaseDriver(process.env.SUPABASE_STORAGE_BUCKET ?? process.env.AVATAR_BUCKET ?? "");
    return _driver;
  }
  throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
}

/** Resolve absolute FS path of a key (only meaningful for fs driver). */
export function fsPathOf(key: string): string {
  const root = process.env.STORAGE_FS_DIR ?? "./storage";
  return path.join(root, key);
}
