import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Réinitialiser le mot de passe</CardTitle>
          <CardDescription>Choisis un nouveau mot de passe pour ton compte AutoBOM.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {token ? (
            <form action={resetPassword} className="flex flex-col gap-3">
              <input type="hidden" name="token" value={token} />
              <Input type="password" name="password" placeholder="Nouveau mot de passe" minLength={8} required autoComplete="new-password" autoFocus />
              <Input type="password" name="confirm" placeholder="Confirmer le nouveau mot de passe" minLength={8} required autoComplete="new-password" />
              <Button type="submit">Mettre à jour le mot de passe</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Lien de réinitialisation manquant.</p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline">Retour à la connexion</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
