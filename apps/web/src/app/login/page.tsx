import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  const adminEmail = process.env.ADMIN_EMAIL;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AutoBOM</CardTitle>
          <CardDescription>Connecte-toi avec ton email et ton mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm adminEmail={adminEmail} />
        </CardContent>
      </Card>
    </div>
  );
}
