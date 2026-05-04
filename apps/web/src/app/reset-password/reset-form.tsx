"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, isPending] = useActionState(resetPassword, null);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <Input
          type="password"
          name="password"
          placeholder="Nouveau mot de passe"
          minLength={8}
          required
          autoComplete="new-password"
          autoFocus
        />
        <Input
          type="password"
          name="confirm"
          placeholder="Confirmer le nouveau mot de passe"
          minLength={8}
          required
          autoComplete="new-password"
        />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
