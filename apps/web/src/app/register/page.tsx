import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerWithPassword } from "../login/actions";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer un compte AutoBOM</CardTitle>
          <CardDescription>Crée ton espace, puis invite ton équipe sur tes projets.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={registerWithPassword} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Input name="firstName" placeholder="Prénom" required autoComplete="given-name" />
              <Input name="lastName" placeholder="Nom" required autoComplete="family-name" />
            </div>
            <Input type="email" name="email" placeholder="you@example.com" required autoComplete="email" />
            <Input type="password" name="password" placeholder="Mot de passe (8 caractères min.)" required autoComplete="new-password" minLength={8} />
            <Input type="password" name="confirm" placeholder="Confirmer le mot de passe" required autoComplete="new-password" minLength={8} />
            <Button type="submit">Créer mon compte</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ? <Link href="/login" className="text-foreground underline">Se connecter</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
