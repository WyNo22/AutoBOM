"use client";

import * as React from "react";
import {
  Plus, Trash2, Search, ExternalLink, ChevronDown,
  Paperclip, X, Eye, Download, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatEUR } from "@/lib/utils";
import {
  addLine,
  deleteLines,
  pasteLines,
  updateLine,
  createSupplierInline,
  getLineAttachments,
  deleteAttachment,
} from "./actions";
import { detectSupplierFromUrl } from "@/lib/detect-supplier";
import type { BomLineStatus } from "@autbom/shared";

// ────────────────────────────────────────────────────────────────────────────
// Types & constants
// ────────────────────────────────────────────────────────────────────────────

type Attachment = {
  id: string;
  bomLineId: string;
  type: string;
  name: string;
  url: string;
  sizeBytes: number | null;
};

type Line = {
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
  tva: number | null;
  leadTimeDays: number | null;
  notes: string | null;
  status: BomLineStatus;
};

type Supplier = { id: string; name: string };

type ColumnKey =
  | "designation"
  | "qty"
  | "material"
  | "supplier"
  | "supplierRef"
  | "productUrl"
  | "unitPriceHT"
  | "tva"
  | "leadTimeDays"
  | "status"
  | "notes";

const COLUMNS: { key: ColumnKey; label: string; width: string; type: "text" | "number" | "supplier" | "status" | "url" }[] = [
  { key: "designation", label: "Désignation", width: "min-w-[240px]", type: "text" },
  { key: "qty", label: "Qté", width: "w-16", type: "number" },
  { key: "material", label: "Matériau", width: "w-32", type: "text" },
  { key: "supplier", label: "Fournisseur", width: "w-44", type: "supplier" },
  { key: "supplierRef", label: "Réf.", width: "w-32", type: "text" },
  { key: "productUrl", label: "URL produit", width: "w-40", type: "url" },
  { key: "unitPriceHT", label: "PU HT (€)", width: "w-28", type: "number" },
  { key: "tva", label: "TVA %", width: "w-20", type: "number" },
  { key: "leadTimeDays", label: "Délai (j)", width: "w-20", type: "number" },
  { key: "status", label: "Statut", width: "w-32", type: "status" },
  { key: "notes", label: "Notes", width: "min-w-[180px]", type: "text" },
];

const STATUS_LABEL: Record<BomLineStatus, string> = {
  to_source: "À sourcer",
  to_validate: "À valider",
  validated: "Validé",
  ordered: "Commandé",
  received: "Reçu",
  cancelled: "Annulé",
};

const STATUS_COLOR: Record<BomLineStatus, string> = {
  to_source: "bg-amber-100 text-amber-900",
  to_validate: "bg-blue-100 text-blue-900",
  validated: "bg-emerald-100 text-emerald-900",
  ordered: "bg-violet-100 text-violet-900",
  received: "bg-slate-200 text-slate-900",
  cancelled: "bg-rose-100 text-rose-900",
};

// ────────────────────────────────────────────────────────────────────────────
// Editor component
// ────────────────────────────────────────────────────────────────────────────

export function BomEditor({
  bomId,
  projectId,
  bomName,
  bomStatus,
  initialLines,
  initialSuppliers,
}: {
  bomId: string;
  projectId: string;
  bomName: string;
  bomStatus: string;
  initialLines: Line[];
  initialSuppliers: Supplier[];
}) {
  const [lines, setLines] = React.useState<Line[]>(initialLines);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>(initialSuppliers);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState("");
  const [savingCount, setSavingCount] = React.useState(0);
  // attachments per lineId
  const [attachMap, setAttachMap] = React.useState<Record<string, Attachment[]>>({});
  // which lineId has attachments panel open
  const [attachOpen, setAttachOpen] = React.useState<string | null>(null);
  // DXF preview state
  const [dxfPreview, setDxfPreview] = React.useState<{ name: string; svg: string } | null>(null);

  // ── Filter
  const visibleLines = React.useMemo(() => {
    if (!filter.trim()) return lines;
    const q = filter.toLowerCase();
    return lines.filter(
      (l) =>
        l.designation.toLowerCase().includes(q) ||
        (l.material ?? "").toLowerCase().includes(q) ||
        (l.supplierRef ?? "").toLowerCase().includes(q) ||
        (l.notes ?? "").toLowerCase().includes(q)
    );
  }, [lines, filter]);

  // ── Persistence wrapper (optimistic UI + server)
  const saveCell = React.useCallback(
    async (lineId: string, key: ColumnKey, value: unknown) => {
      // Optimistic local update
      setLines((prev) =>
        prev.map((l) => {
          if (l.id !== lineId) return l;
          if (key === "supplier") return { ...l, supplierId: (value as string | null) ?? null };
          // Normalize numeric coercion for local state too
          if (
            key === "qty" ||
            key === "unitPriceHT" ||
            key === "tva" ||
            key === "leadTimeDays"
          ) {
            const v = value === "" || value == null ? null : Number(String(value).replace(",", "."));
            const num = Number.isFinite(v as number) ? (v as number) : null;
            return { ...l, [key]: key === "qty" ? num ?? 1 : num };
          }
          if (key === "status") return { ...l, status: value as BomLineStatus };
          return { ...l, [key]: (value as string) || null };
        })
      );

      setSavingCount((c) => c + 1);
      try {
        const patch: Record<string, unknown> = {};
        if (key === "supplier") patch.supplierId = value || null;
        else patch[key] = value;
        await updateLine(bomId, lineId, patch);
      } finally {
        setSavingCount((c) => c - 1);
      }
    },
    [bomId]
  );

  // ── Add row
  const handleAddLine = React.useCallback(async () => {
    const created = await addLine(bomId);
    setLines((prev) => [...prev, created as Line]);
    // Focus the designation cell of the new row after render
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        `[data-cell="${created.id}|designation"] input`
      );
      el?.focus();
    }, 0);
  }, [bomId]);

  // ── Delete selected
  const handleDeleteSelected = React.useCallback(async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setLines((prev) => prev.filter((l) => !selected.has(l.id)));
    setSelected(new Set());
    setSavingCount((c) => c + 1);
    try {
      await deleteLines(bomId, ids);
    } finally {
      setSavingCount((c) => c - 1);
    }
  }, [bomId, selected]);

  // ── Paste from Excel (capture on focused cell)
  const handlePaste = React.useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const text = e.clipboardData.getData("text/plain");
      if (!text || !text.includes("\t")) return; // not a tabular paste
      e.preventDefault();
      const rows = text
        .replace(/\r/g, "")
        .split("\n")
        .filter((row) => row.length > 0)
        .map((row) => row.split("\t"));
      if (rows.length === 0) return;
      setSavingCount((c) => c + 1);
      try {
        const inserted = await pasteLines(bomId, rows);
        setLines((prev) => [...prev, ...(inserted as Line[])]);
      } finally {
        setSavingCount((c) => c - 1);
      }
    },
    [bomId]
  );

  // ── Keyboard navigation between cells: Tab, Shift+Tab, Enter
  const handleKeyNav = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, lineId: string, colKey: ColumnKey) => {
      if (e.key !== "Tab" && e.key !== "Enter") return;
      const lineIdx = visibleLines.findIndex((l) => l.id === lineId);
      const colIdx = COLUMNS.findIndex((c) => c.key === colKey);
      if (lineIdx < 0 || colIdx < 0) return;

      let nextLine = lineIdx;
      let nextCol = colIdx;

      if (e.key === "Enter") {
        e.preventDefault();
        nextLine = lineIdx + 1;
      } else if (e.key === "Tab") {
        if (e.shiftKey) {
          nextCol = colIdx - 1;
          if (nextCol < 0) {
            nextCol = COLUMNS.length - 1;
            nextLine = lineIdx - 1;
          }
        } else {
          nextCol = colIdx + 1;
          if (nextCol >= COLUMNS.length) {
            nextCol = 0;
            nextLine = lineIdx + 1;
          }
        }
        e.preventDefault();
      }

      if (nextLine < 0) return;
      if (nextLine >= visibleLines.length) {
        // Tab past the end → create a new line
        if (!e.shiftKey) {
          handleAddLine();
        }
        return;
      }

      const targetId = visibleLines[nextLine].id;
      const targetCol = COLUMNS[nextCol].key;
      const el = document.querySelector<HTMLInputElement>(
        `[data-cell="${targetId}|${targetCol}"] input, [data-cell="${targetId}|${targetCol}"] button`
      );
      el?.focus();
      if (el instanceof HTMLInputElement) el.select();
    },
    [visibleLines, handleAddLine]
  );

  // ── Toggle row selection
  function toggleRow(id: string, e: React.MouseEvent) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && prev.size > 0) {
        // Range select from last clicked row in lines order
        const lastId = Array.from(prev).pop()!;
        const a = lines.findIndex((l) => l.id === lastId);
        const b = lines.findIndex((l) => l.id === id);
        const [from, to] = a < b ? [a, b] : [b, a];
        for (let i = from; i <= to; i++) next.add(lines[i].id);
      } else if (e.ctrlKey || e.metaKey) {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else {
        if (next.has(id) && next.size === 1) next.delete(id);
        else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  }

  // ── Inline supplier creation
  async function handleCreateSupplier(name: string, lineId: string): Promise<string> {
    const created = await createSupplierInline(name);
    setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    await saveCell(lineId, "supplier", created.id);
    return created.id;
  }

  // ── Auto-detect supplier when URL changes
  async function handleUrlSaved(lineId: string, url: string) {
    await saveCell(lineId, "productUrl", url);
    if (!url) return;
    const detected = detectSupplierFromUrl(url);
    if (!detected) return;
    const line = lines.find((l) => l.id === lineId);
    if (line?.supplierId) return; // already set
    // Try to find existing supplier by name
    const existing = suppliers.find(
      (s) => s.name.toLowerCase() === detected.name.toLowerCase()
    );
    if (existing) {
      await saveCell(lineId, "supplier", existing.id);
    } else {
      // Create it
      await handleCreateSupplier(detected.name, lineId);
    }
  }

  // ── Open attachments panel for a line
  async function handleOpenAttachments(lineId: string) {
    if (attachOpen === lineId) { setAttachOpen(null); return; }
    setAttachOpen(lineId);
    if (!attachMap[lineId]) {
      const atts = await getLineAttachments(bomId, lineId);
      setAttachMap((prev) => ({ ...prev, [lineId]: atts as Attachment[] }));
    }
  }

  // ── Upload a file to a line
  async function handleUpload(lineId: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bomLineId", lineId);
    setSavingCount((c) => c + 1);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { attachment } = await res.json() as { attachment: Attachment };
      setAttachMap((prev) => ({
        ...prev,
        [lineId]: [...(prev[lineId] ?? []), attachment],
      }));
      // Auto-fill designation if empty
      const line = lines.find((l) => l.id === lineId);
      if (line && !line.designation.trim()) {
        const stem = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
        await saveCell(lineId, "designation", stem);
      }
    } finally {
      setSavingCount((c) => c - 1);
    }
  }

  // ── Delete an attachment
  async function handleDeleteAttachment(lineId: string, attId: string) {
    await deleteAttachment(bomId, attId);
    setAttachMap((prev) => ({
      ...prev,
      [lineId]: (prev[lineId] ?? []).filter((a) => a.id !== attId),
    }));
  }

  // ── DXF preview
  async function handleDxfPreview(att: Attachment) {
    try {
      const res = await fetch(att.url.startsWith("http") ? att.url : `/api/files/${encodeURIComponent(att.url)}`);
      const text = await res.text();
      // Dynamic import to avoid SSR
      const mod = await import("dxf-parser");
      const DxfParser = (mod.default ?? mod) as { new(): { parseSync(s: string): unknown } };
      const parser = new DxfParser();
      const dxf = parser.parseSync(text) as { entities?: { type: string; vertices?: {x:number;y:number}[]; startPoint?: {x:number;y:number}; endPoint?: {x:number;y:number}; center?: {x:number;y:number}; radius?: number }[] };
      const svg = dxfToSvg(dxf);
      setDxfPreview({ name: att.name, svg });
    } catch {
      alert("Impossible de lire ce fichier DXF.");
    }
  }

  // ── Totals
  const totalHT = lines.reduce((sum, l) => sum + (l.unitPriceHT ?? 0) * l.qty, 0);
  const totalTTC = lines.reduce((sum, l) => sum + (l.unitPriceHT ?? 0) * l.qty * (1 + (l.tva ?? 0)), 0);

  return (
    <div onPaste={handlePaste} className="space-y-3">
      {/* ── DXF Modal */}
      {dxfPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setDxfPreview(null)}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">{dxfPreview.name}</span>
              <button onClick={() => setDxfPreview(null)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div
              className="w-full overflow-auto bg-white rounded"
              dangerouslySetInnerHTML={{ __html: dxfPreview.svg }}
            />
          </div>
        </div>
      )}

      {/* ── Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-semibold tracking-tight mr-auto">
          {bomName}{" "}
          <span className="text-xs font-normal text-muted-foreground capitalize ml-2">
            {bomStatus}
          </span>
        </h1>

        <div className="relative">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Filtrer…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 w-56"
          />
        </div>

        <Button onClick={handleAddLine} size="sm">
          <Plus className="size-4" />
          Ligne
        </Button>

        <Button
          onClick={handleDeleteSelected}
          size="sm"
          variant="outline"
          disabled={selected.size === 0}
        >
          <Trash2 className="size-4" />
          Suppr ({selected.size})
        </Button>

        <a
          href={`/api/boms/${bomId}/export`}
          download
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-background hover:bg-muted transition-colors"
        >
          <Download className="size-3.5" />
          Export Excel
        </a>

        <span
          className={cn(
            "text-xs px-2 py-1 rounded transition-opacity",
            savingCount > 0 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
          )}
        >
          {savingCount > 0 ? "Enregistrement…" : "Enregistré"}
        </span>
      </div>

      {/* ── Hint */}
      {lines.length === 0 && (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          BOM vide. Clique <strong>Ligne</strong> pour ajouter, ou colle directement
          depuis Excel (Ctrl+V) — les colonnes sont <em>Désignation, Qté, Matériau, Réf, URL,
          PU HT, TVA, Délai, Notes</em>.
        </div>
      )}

      {/* ── Table */}
      {lines.length > 0 && (
        <div className="border border-border rounded-md overflow-x-auto bg-card">
          <table className="text-sm w-full">
            <thead className="bg-muted/60 text-left text-xs font-medium text-muted-foreground border-b border-border">
              <tr>
                <th className="w-10 px-2 py-2"></th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className={cn("px-2 py-2 font-medium", c.width)}>
                    {c.label}
                  </th>
                ))}
                <th className="w-10 px-2 py-2" title="Fichiers"><Paperclip className="size-3" /></th>
              </tr>
            </thead>
            <tbody>
              {visibleLines.map((line, i) => (
                <React.Fragment key={line.id}>
                <tr
                  className={cn(
                    "border-b border-border hover:bg-muted/30",
                    selected.has(line.id) && "bg-accent/40"
                  )}
                >
                  <td
                    className="text-xs text-muted-foreground text-center cursor-pointer select-none px-2 py-1"
                    onClick={(e) => toggleRow(line.id, e)}
                  >
                    {i + 1}
                  </td>

                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      data-cell={`${line.id}|${c.key}`}
                      className={cn("p-0 align-middle", c.width)}
                    >
                      <CellRenderer
                        line={line}
                        column={c}
                        suppliers={suppliers}
                        onSave={(value) =>
                          c.key === "productUrl"
                            ? handleUrlSaved(line.id, value as string)
                            : saveCell(line.id, c.key, value)
                        }
                        onCreateSupplier={(name) => handleCreateSupplier(name, line.id)}
                        onKeyNav={(e) => handleKeyNav(e, line.id, c.key)}
                      />
                    </td>
                  ))}
                  {/* Attachments toggle cell */}
                  <td className="w-10 p-0 align-middle">
                    <button
                      type="button"
                      title="Fichiers joints"
                      onClick={() => handleOpenAttachments(line.id)}
                      className={cn(
                        "w-full h-full flex items-center justify-center px-2 py-1.5 hover:bg-muted/50 text-muted-foreground",
                        attachOpen === line.id && "text-blue-600"
                      )}
                    >
                      <Paperclip className="size-3.5" />
                      {(attachMap[line.id]?.length ?? 0) > 0 && (
                        <span className="ml-0.5 text-[10px] font-medium">
                          {attachMap[line.id].length}
                        </span>
                      )}
                    </button>
                  </td>
                </tr>
                {/* Attachments sub-row */}
                {attachOpen === line.id && (
                  <tr className="bg-muted/20 border-b border-border">
                    <td colSpan={COLUMNS.length + 2} className="px-4 py-3">
                      <AttachmentsPanel
                        attachments={attachMap[line.id] ?? []}
                        onUpload={(file) => handleUpload(line.id, file)}
                        onDelete={(attId) => handleDeleteAttachment(line.id, attId)}
                        onDxfPreview={handleDxfPreview}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
            {/* Footer with totals */}
            <tfoot className="bg-muted/40 text-xs">
              <tr>
                <td colSpan={6} className="px-2 py-2 text-right text-muted-foreground">
                  Total :
                </td>
                <td className="px-2 py-2 font-medium" colSpan={2}>
                  HT {formatEUR(totalHT)}
                </td>
                <td colSpan={2} className="px-2 py-2 font-medium">
                  TTC {formatEUR(totalTTC)}
                </td>
                <td className="px-2 py-2 text-muted-foreground">
                  {lines.length} ligne{lines.length > 1 ? "s" : ""}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CellRenderer — dispatches to the right input/widget per column
// ────────────────────────────────────────────────────────────────────────────

function CellRenderer({
  line,
  column,
  suppliers,
  onSave,
  onCreateSupplier,
  onKeyNav,
}: {
  line: Line;
  column: { key: ColumnKey; type: "text" | "number" | "supplier" | "status" | "url" };
  suppliers: Supplier[];
  onSave: (value: unknown) => void;
  onCreateSupplier: (name: string) => Promise<string>;
  onKeyNav: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  if (column.type === "supplier") {
    return (
      <SupplierCombobox
        value={line.supplierId}
        suppliers={suppliers}
        onChange={onSave}
        onCreate={onCreateSupplier}
      />
    );
  }
  if (column.type === "status") {
    return (
      <select
        value={line.status}
        onChange={(e) => onSave(e.target.value as BomLineStatus)}
        className={cn(
          "w-full bg-transparent text-xs font-medium px-2 py-1.5 rounded-none border-0 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer",
          STATUS_COLOR[line.status]
        )}
      >
        {(Object.keys(STATUS_LABEL) as BomLineStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    );
  }
  if (column.type === "url") {
    return (
      <UrlCell
        value={line.productUrl}
        onSave={(v) => onSave(v)}
        onKeyNav={onKeyNav}
      />
    );
  }

  const raw = (line as unknown as Record<string, unknown>)[column.key];
  return (
    <InlineInput
      value={raw == null ? "" : String(raw)}
      type={column.type === "number" ? "number" : "text"}
      onSave={onSave}
      onKeyNav={onKeyNav}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// InlineInput — debounced save on change, save also on blur
// ────────────────────────────────────────────────────────────────────────────

function InlineInput({
  value,
  type,
  onSave,
  onKeyNav,
}: {
  value: string;
  type: "text" | "number";
  onSave: (value: unknown) => void;
  onKeyNav: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [local, setLocal] = React.useState(value);
  const lastSaved = React.useRef(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from prop when external state updates (e.g. after paste)
  React.useEffect(() => {
    setLocal(value);
    lastSaved.current = value;
  }, [value]);

  function flush(v: string) {
    if (v === lastSaved.current) return;
    lastSaved.current = v;
    onSave(v);
  }

  return (
    <input
      type={type === "number" ? "text" : "text"}
      inputMode={type === "number" ? "decimal" : undefined}
      value={local}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => flush(v), 400);
      }}
      onBlur={() => {
        if (timer.current) clearTimeout(timer.current);
        flush(local);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setLocal(lastSaved.current);
          (e.currentTarget as HTMLInputElement).blur();
          return;
        }
        onKeyNav(e);
      }}
      className="w-full bg-transparent border-0 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background rounded-none"
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// UrlCell — show link icon when there's a URL, edit mode on click
// ────────────────────────────────────────────────────────────────────────────

function UrlCell({
  value,
  onSave,
  onKeyNav,
}: {
  value: string | null;
  onSave: (value: unknown) => void;
  onKeyNav: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [editing, setEditing] = React.useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full px-2 py-1.5 text-left flex items-center gap-1 text-sm hover:bg-muted/50"
      >
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            <ExternalLink className="size-3.5" />
            <span className="truncate max-w-[160px]">
              {(() => { try { return new URL(value).hostname; } catch { return value; } })()}
            </span>
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </button>
    );
  }

  return (
    <InlineInput
      value={value ?? ""}
      type="text"
      onSave={(v) => {
        onSave(v);
        setEditing(false);
      }}
      onKeyNav={(e) => {
        if (e.key === "Escape" || e.key === "Enter" || e.key === "Tab") setEditing(false);
        onKeyNav(e);
      }}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SupplierCombobox — type to filter, click to pick, "+ Créer" if no match
// ────────────────────────────────────────────────────────────────────────────

function SupplierCombobox({
  value,
  suppliers,
  onChange,
  onCreate,
}: {
  value: string | null;
  suppliers: Supplier[];
  onChange: (id: string | null) => void;
  onCreate: (name: string) => Promise<string>;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  const current = suppliers.find((s) => s.id === value);
  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  const exact = suppliers.some((s) => s.name.toLowerCase() === query.trim().toLowerCase());

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setQuery("");
        }}
        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted/50 flex items-center justify-between gap-1"
      >
        <span className={cn(!current && "text-muted-foreground")}>
          {current?.name ?? "—"}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-1 w-64 bg-card border border-border rounded-md shadow-md p-1">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher / créer…"
            className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded mb-1 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="max-h-56 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded"
              >
                ✕ Retirer le fournisseur
              </button>
            )}
            {filtered.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded"
              >
                {s.name}
              </button>
            ))}
            {!exact && query.trim().length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await onCreate(query.trim());
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded text-blue-600 font-medium"
              >
                + Créer « {query.trim()} »
              </button>
            )}
            {filtered.length === 0 && exact && (
              <div className="px-2 py-2 text-xs text-muted-foreground">Aucun résultat.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AttachmentsPanel — file list + drop zone per BOM line
// ────────────────────────────────────────────────────────────────────────────

function AttachmentsPanel({
  attachments,
  onUpload,
  onDelete,
  onDxfPreview,
}: {
  attachments: Attachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDxfPreview: (att: Attachment) => Promise<void>;
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      await onUpload(file);
    }
  }

  return (
    <div className="space-y-2">
      {/* Existing files */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 bg-background border border-border rounded px-2 py-1 text-xs group"
            >
              <FileText className="size-3 text-muted-foreground shrink-0" />
              <span className="max-w-[180px] truncate" title={att.name}>{att.name}</span>
              {att.sizeBytes && (
                <span className="text-muted-foreground">
                  ({(att.sizeBytes / 1024).toFixed(0)} Ko)
                </span>
              )}
              {att.type === "dxf" && (
                <button
                  type="button"
                  title="Aperçu DXF"
                  onClick={() => onDxfPreview(att)}
                  className="text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="size-3.5" />
                </button>
              )}
              <a
                href={att.url.startsWith("http") ? att.url : `/api/files/${encodeURIComponent(att.url)}`}
                download={att.name}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                title="Télécharger"
              >
                <Download className="size-3.5" />
              </a>
              <button
                type="button"
                title="Supprimer"
                onClick={() => onDelete(att.id)}
                className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center gap-2 border border-dashed rounded px-3 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors",
          dragging && "border-blue-400 bg-blue-50 text-blue-700"
        )}
      >
        <Paperclip className="size-3.5 shrink-0" />
        <span>Glisse un fichier ici ou clique pour sélectionner (DXF, STEP, PDF, image…)</span>
        <input
          ref={inputRef}
          type="file"
          accept=".dxf,.step,.stp,.stl,.3mf,.pdf,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// dxfToSvg — minimal DXF→SVG converter (LINE, LWPOLYLINE, ARC, CIRCLE)
// Uses the parsed object from dxf-parser. Returns an SVG string.
// ────────────────────────────────────────────────────────────────────────────

type DxfEntity = {
  type: string;
  vertices?: { x: number; y: number }[];
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
};

type DxfDoc = { entities?: DxfEntity[] };

function dxfToSvg(dxf: DxfDoc): string {
  const entities = dxf.entities ?? [];
  const paths: string[] = [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  function track(x: number, y: number) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  for (const ent of entities) {
    if (ent.type === "LINE" && ent.startPoint && ent.endPoint) {
      const { x: x1, y: y1 } = ent.startPoint;
      const { x: x2, y: y2 } = ent.endPoint;
      track(x1, y1); track(x2, y2);
      paths.push(`<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" />`);
    } else if ((ent.type === "LWPOLYLINE" || ent.type === "POLYLINE") && ent.vertices?.length) {
      const pts = ent.vertices.map((v) => { track(v.x, v.y); return `${v.x},${-v.y}`; }).join(" ");
      paths.push(`<polyline points="${pts}" />`);
    } else if (ent.type === "CIRCLE" && ent.center && ent.radius != null) {
      const { x, y } = ent.center;
      track(x - ent.radius, y - ent.radius);
      track(x + ent.radius, y + ent.radius);
      paths.push(`<circle cx="${x}" cy="${-y}" r="${ent.radius}" />`);
    } else if (ent.type === "ARC" && ent.center && ent.radius != null) {
      const { x, y } = ent.center;
      const r = ent.radius;
      const sa = ((ent.startAngle ?? 0) * Math.PI) / 180;
      const ea = ((ent.endAngle ?? 360) * Math.PI) / 180;
      const x1 = x + r * Math.cos(sa);
      const y1 = -(y + r * Math.sin(sa));
      const x2 = x + r * Math.cos(ea);
      const y2 = -(y + r * Math.sin(ea));
      const large = (ea - sa + 2 * Math.PI) % (2 * Math.PI) > Math.PI ? 1 : 0;
      track(x - r, y - r); track(x + r, y + r);
      paths.push(`<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}" />`);
    }
  }

  if (paths.length === 0) return `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" font-size="14">Aucune entité 2D détectée.</text></svg>`;

  const pad = 10;
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const vb = `${minX - pad} ${-maxY - pad} ${w + pad * 2} ${h + pad * 2}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="100%" style="max-height:60vh;display:block;" stroke="#1e293b" stroke-width="${w / 400}" fill="none">
${paths.join("\n")}
</svg>`;
}
