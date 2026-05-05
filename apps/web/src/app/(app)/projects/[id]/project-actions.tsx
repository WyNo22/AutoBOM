"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { renameProject, deleteProject } from "../actions";

type Project = { id: string; name: string; description: string | null };

export function ProjectActions({ project }: { project: Project }) {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description ?? "");
  const [pending, setPending] = React.useState(false);

  async function handleRename() {
    if (!name.trim()) return;
    setPending(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description);
    await renameProject(project.id, fd);
    setPending(false);
    setRenaming(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement le projet « ${project.name} » et toutes ses BOMs ?`)) return;
    await deleteProject(project.id);
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground border border-border"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <Pencil className="size-3.5" />
            Renommer le projet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={handleDelete}>
            <Trash2 className="size-3.5" />
            Supprimer le projet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {renaming && (
        <div className="mt-3 flex flex-col gap-2 p-3 border border-border rounded-md bg-muted/30 w-72">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du projet"
            autoFocus
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRename} disabled={pending}>
              <Check className="size-3.5" />
              Enregistrer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setRenaming(false); setName(project.name); setDescription(project.description ?? ""); }}>
              <X className="size-3.5" />
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
