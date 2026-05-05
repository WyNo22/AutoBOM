"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Check, X, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { renameBom, deleteBom } from "./actions";

type Bom = {
  id: string;
  name: string;
  status: string;
  currentVersion: number;
  updatedAt: Date;
};

export function BomCard({ bom, projectId }: { bom: Bom; projectId: string }) {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(bom.name);
  const [pending, setPending] = React.useState(false);

  async function handleRename() {
    if (!name.trim()) return;
    setPending(true);
    await renameBom(bom.id, name.trim());
    setPending(false);
    setRenaming(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement la BOM « ${bom.name} » ?`)) return;
    await deleteBom(bom.id);
  }

  return (
    <Card className="hover:border-foreground/30 transition-colors">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4">
          <Link href={`/projects/${projectId}/boms/${bom.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <FileSpreadsheet className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{bom.name}</div>
              <div className="text-xs text-muted-foreground">
                v{bom.currentVersion} · maj {formatDate(bom.updatedAt)}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground capitalize">
              {bom.status}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setRenaming(true)}>
                  <Pencil className="size-3.5" />
                  Renommer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={handleDelete}>
                  <Trash2 className="size-3.5" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {renaming && (
          <div className="px-4 pb-3 flex gap-2 border-t border-border pt-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la BOM"
              autoFocus
              className="flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setRenaming(false); setName(bom.name); } }}
            />
            <Button size="sm" onClick={handleRename} disabled={pending}>
              <Check className="size-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setRenaming(false); setName(bom.name); }}>
              <X className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
