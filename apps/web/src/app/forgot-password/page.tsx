import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestPasswordReset } from "../login/actions";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>Entre ton email et nous t’enverrons un lien de réinitialisation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={requestPasswordReset} className="flex flex-col gap-3">
            <Input type="email" name="email" placeholder="you@example.com" required autoComplete="email" autoFocus />
            <Button type="submit">Envoyer le lien</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline">Retour à la connexion</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
