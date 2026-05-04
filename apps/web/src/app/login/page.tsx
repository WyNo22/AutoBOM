import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginWithPassword } from "./actions";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  const adminEmail = process.env.ADMIN_EMAIL;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AutoBOM</CardTitle>
          <CardDescription>
            Connecte-toi avec ton email et ton mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={loginWithPassword} className="flex flex-col gap-3">
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
            <Button type="submit">Se connecter</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="text-foreground underline">Mot de passe oublié ?</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ? <Link href="/register" className="text-foreground underline">Créer un compte</Link>
          </p>
          {adminEmail && (
            <form action="/api/auth/admin-bypass" method="post">
              <Button type="submit" variant="outline" className="w-full text-xs text-muted-foreground">
                ⚡ Admin — {adminEmail}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
