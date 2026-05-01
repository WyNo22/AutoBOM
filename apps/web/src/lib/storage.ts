import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Storage abstraction. Two drivers:
 *  - "fs" (default, dev): writes under STORAGE_FS_DIR
 *  - "s3" (prod): wired here as a stub, to be implemented in Sprint 2+.
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

let _driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (_driver) return _driver;
  const driver = process.env.STORAGE_DRIVER ?? "fs";
  if (driver === "fs") {
    _driver = new FsDriver(process.env.STORAGE_FS_DIR ?? "./storage");
    return _driver;
  }
  if (driver === "s3") {
    throw new Error("S3 storage driver not implemented yet (Sprint 2+).");
  }
  throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
}

/** Resolve absolute FS path of a key (only meaningful for fs driver). */
export function fsPathOf(key: string): string {
  const root = process.env.STORAGE_FS_DIR ?? "./storage";
  return path.join(root, key);
}
