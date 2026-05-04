import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetForm } from "./reset-form";

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
            <ResetForm token={token} />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Lien de réinitialisation manquant.</p>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/forgot-password" className="text-foreground underline">Redemander un lien</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
