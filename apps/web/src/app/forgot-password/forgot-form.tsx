"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "../login/actions";

export function ForgotForm() {
  const [, action, isPending] = useActionState(requestPasswordReset, null);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Envoi..." : "Envoyer le lien"}
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
