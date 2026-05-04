import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Vérifiez votre boîte mail</CardTitle>
          <CardDescription>
            {email ? (
              <>
                Un lien de vérification a été envoyé à{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            ) : (
              "Un lien de vérification vient d'être envoyé."
            )}
            {" "}Cliquez dessus pour activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-center">
          <p className="text-xs text-muted-foreground">
            Vous ne trouvez pas l&apos;email ? Vérifiez vos spams ou{" "}
            <Link href="/login" className="underline">retentez la connexion</Link>{" "}
            pour recevoir un nouveau lien.
          </p>
          <Button variant="outline" className="w-full">
            <Link href="/login">Retour à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
