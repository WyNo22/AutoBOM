import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordCheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Consulte ta boîte mail</CardTitle>
          <CardDescription>Si un compte existe avec cet email, un lien de réinitialisation vient d’être envoyé.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
