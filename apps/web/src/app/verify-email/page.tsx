import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyForm } from "./verify-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Valider mon compte AutoBOM</CardTitle>
          <CardDescription>Clique sur le bouton pour confirmer ton adresse email et accéder à AutoBOM.</CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
