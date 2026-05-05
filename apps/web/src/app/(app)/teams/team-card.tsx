"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Check, X, Users, Link as LinkIcon, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MemberSearch } from "@/components/member-search";
import { renameTeam, deleteTeam, addTeamMemberById, updateTeamMemberRole, removeTeamMember, createTeamInvite } from "./actions";
import { cn } from "@/lib/utils";

const TEAM_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Membre" },
  { value: "validator", label: "Validateur" },
  { value: "buyer", label: "Acheteur" },
  { value: "viewer", label: "Lecteur" },
];

type Member = {
  userId: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string;
};

type TeamData = {
  teamId: string;
  teamName: string;
  teamOwnerId: string;
  currentRole: string;
  projectId: string | null;
  projectName: string | null;
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(m: Member): string {
  const first = m.firstName ?? m.name?.split(" ")[0] ?? (m.email ?? "?")[0];
  const last = m.lastName ?? m.name?.split(" ")[1] ?? "";
  return `${(first[0] ?? "").toUpperCase()}${(last[0] ?? "").toUpperCase()}`;
}

export function TeamCard({ team, members }: { team: TeamData; members: Member[] }) {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(team.teamName);
  const [pending, setPending] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState("member");
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const canAdmin = ["owner", "admin"].includes(team.currentRole);

  async function handleRename() {
    if (!name.trim()) return;
    setPending(true);
    const fd = new FormData();
    fd.append("name", name.trim());
    await renameTeam(team.teamId, fd);
    setPending(false);
    setRenaming(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Supprimer définitivement l'équipe « ${team.teamName} » ?`)) return;
    await deleteTeam(team.teamId);
  }

  async function handleAddMember() {
    if (!selectedUserId) return;
    setPending(true);
    await addTeamMemberById(team.teamId, selectedUserId, selectedRole);
    setSelectedUserId(null);
    setPending(false);
  }

  async function handleRemoveMember(memberId: string, memberEmail: string) {
    if (!window.confirm(`Retirer ${memberEmail} de l'équipe ?`)) return;
    await removeTeamMember(team.teamId, memberId);
  }

  async function handleCreateInvite() {
    setPending(true);
    try {
      const path = await createTeamInvite(team.teamId, selectedRole);
      const url = `${window.location.origin}${path}`;
      setInviteLink(url);
      await navigator.clipboard?.writeText(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              {team.teamName}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Ton rôle : {team.currentRole}</p>
            {team.projectId && (
              <Link
                href={`/projects/${team.projectId}`}
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <LinkIcon className="size-3" />
                Projet lié : {team.projectName}
              </Link>
            )}
          </div>
          {canAdmin && (
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
                  Supprimer l&apos;équipe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {renaming && canAdmin && (
          <div className="flex gap-2 mt-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setRenaming(false); setName(team.teamName); } }}
            />
            <Button size="sm" onClick={handleRename} disabled={pending}><Check className="size-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={() => { setRenaming(false); setName(team.teamName); }}><X className="size-3.5" /></Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {canAdmin && (
          <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
            <MemberSearch
              teamId={team.teamId}
              onSelect={(user) => setSelectedUserId(user.id)}
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-sm"
            >
              {TEAM_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!selectedUserId || pending}
              onClick={handleAddMember}
            >
              Ajouter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleCreateInvite}
            >
              <Copy className="size-3.5" />
              Lien
            </Button>
          </div>
        )}

        {inviteLink && (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Lien copié : <span className="text-foreground break-all">{inviteLink}</span>
          </div>
        )}

        <div className="divide-y rounded-md border border-border">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              member={member}
              teamId={team.teamId}
              canAdmin={canAdmin}
              onRemove={() => handleRemoveMember(member.userId, member.email ?? member.userId)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MemberRow({
  member,
  teamId,
  canAdmin,
  onRemove,
}: {
  member: Member;
  teamId: string;
  canAdmin: boolean;
  onRemove: () => void;
}) {
  const displayName = member.name || `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;
  const initials = getInitials(member);
  const color = avatarColor(member.userId);

  async function handleRoleChange(newRole: string) {
    const fd = new FormData();
    fd.append("role", newRole);
    await updateTeamMemberRole(teamId, member.userId, fd);
  }

  return (
    <div className="flex items-center gap-3 p-3">
      <div className={cn("size-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0", color)}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{displayName}</div>
        <div className="text-xs text-muted-foreground truncate">{member.email}</div>
      </div>
      {canAdmin && member.role !== "owner" ? (
        <div className="flex items-center gap-2 shrink-0">
          <select
            defaultValue={member.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          >
            {TEAM_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-1 rounded hover:bg-accent text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem destructive onClick={onRemove}>
                <Trash2 className="size-3.5" />
                Retirer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground capitalize shrink-0">{member.role}</span>
      )}
    </div>
  );
}
