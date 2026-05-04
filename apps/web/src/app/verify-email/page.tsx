import Link from "next/link";
import { redirect } from "next/navigation";
import { db, users } from "@/lib/db";
import { consumeAccountToken } from "@/lib/account-email";
import { createAuthSession } from "@/lib/auth-session";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/login");

  const accountToken = await consumeAccountToken(token, "email_verification");
  if (!accountToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Lien invalide ou expiré</CardTitle>
            <CardDescription>Reconnecte-toi pour recevoir un nouveau lien de validation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full"><Link href="/login">Retour à la connexion</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, accountToken.userId));
  await createAuthSession(accountToken.userId);
  redirect("/projects");
}
