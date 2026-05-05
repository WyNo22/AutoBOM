"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { renameProject, deleteProject } from "./actions";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export function ProjectCard({ project }: { project: Project }) {
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
    <Card className="hover:border-foreground/30 transition-colors h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
            <CardTitle className="text-base hover:underline truncate">{project.name}</CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{project.description}</p>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
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
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground pt-0">
        Créé le {formatDate(project.createdAt)}
      </CardContent>
      {renaming && (
        <CardContent className="pt-0 flex flex-col gap-2">
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
        </CardContent>
      )}
    </Card>
  );
}
