"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerWithPassword } from "../login/actions";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerWithPassword, null);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Input name="firstName" placeholder="Prénom" required autoComplete="given-name" />
          <Input name="lastName" placeholder="Nom" required autoComplete="family-name" />
        </div>
        <Input type="email" name="email" placeholder="you@example.com" required autoComplete="email" />
        <Input
          type="password"
          name="password"
          placeholder="Mot de passe (8 caractères min.)"
          required
          autoComplete="new-password"
          minLength={8}
        />
        <Input
          type="password"
          name="confirm"
          placeholder="Confirmer le mot de passe"
          required
          autoComplete="new-password"
          minLength={8}
        />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Création..." : "Créer mon compte"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-foreground underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
