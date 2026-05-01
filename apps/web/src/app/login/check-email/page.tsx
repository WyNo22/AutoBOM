import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vérifie ta boîte mail</CardTitle>
          <CardDescription>
            Un lien de connexion vient d&apos;être envoyé. Clique dessus pour accéder à AutoBOM.
            <br />
            <span className="text-xs">
              (en dev avec MAIL_DRIVER=console, le lien apparaît dans la console
              du serveur Next)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
