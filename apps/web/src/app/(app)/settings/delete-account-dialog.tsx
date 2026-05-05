"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { deleteAccount } from "./actions";

type Summary = {
  ownedProjects: number;
  ownedBoms: number;
  ownedTeams: number;
  attachmentCount: number;
};

export function DeleteAccountDialog() {
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/me/account-summary");
      if (res.ok) setSummary(await res.json() as Summary);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setConfirmation("");
    setSummary(null);
    loadSummary();
  }

  async function handleDelete() {
    if (confirmation !== "SUPPRIMER") return;
    setPending(true);
    await deleteAccount();
  }

  const canDelete = confirmation === "SUPPRIMER";

  return (
    <>
      <Button type="button" variant="destructive" onClick={handleOpen}>
        <Trash2 className="size-4" />
        Supprimer mon compte
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogClose onClose={() => setOpen(false)} />
          <DialogHeader>
            <DialogTitle>Supprimer définitivement mon compte</DialogTitle>
            <DialogDescription>
              Cette action est <strong>irréversible</strong>. Toutes tes données seront effacées.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Calcul des données à supprimer…</p>
            ) : summary ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-1 text-sm">
                <p className="font-medium text-destructive">Sera supprimé :</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>{summary.ownedProjects} projet{summary.ownedProjects !== 1 ? "s" : ""} dont tu es propriétaire</li>
                  <li>{summary.ownedBoms} BOM{summary.ownedBoms !== 1 ? "s" : ""} associée{summary.ownedBoms !== 1 ? "s" : ""}</li>
                  <li>{summary.attachmentCount} fichier{summary.attachmentCount !== 1 ? "s" : ""} joint{summary.attachmentCount !== 1 ? "s" : ""}</li>
                  <li>{summary.ownedTeams} équipe{summary.ownedTeams !== 1 ? "s" : ""} dont tu es propriétaire</li>
                  <li>Ton compte, sessions et données personnelles</li>
                </ul>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Pour confirmer, tape <strong className="text-foreground">SUPPRIMER</strong> ci-dessous :
              </p>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="SUPPRIMER"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || pending}
            >
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
