"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithPassword } from "./actions";

export function LoginForm({ adminEmail }: { adminEmail?: string }) {
  const [state, action, isPending] = useActionState(loginWithPassword, null);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          autoFocus
          autoComplete="email"
        />
        <Input
          type="password"
          name="password"
          placeholder="Mot de passe"
          required
          autoComplete="current-password"
        />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-foreground underline">
          Mot de passe oublié ?
        </Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-foreground underline">
          Créer un compte
        </Link>
      </p>
      {adminEmail && (
        <form action="/api/auth/admin-bypass" method="post">
          <Button type="submit" variant="outline" className="w-full text-xs text-muted-foreground">
            ⚡ Admin — {adminEmail}
          </Button>
        </form>
      )}
    </div>
  );
}
