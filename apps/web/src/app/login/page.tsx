import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/projects");

  const adminEmail = process.env.ADMIN_EMAIL;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (!email) return;
    await signIn("resend", { email, redirectTo: "/projects" });
  }

  async function adminLogin() {
    "use server";
    const email = process.env.ADMIN_EMAIL;
    if (!email) return;
    await signIn("resend", { email, redirectTo: "/projects" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AutoBOM</CardTitle>
          <CardDescription>
            Entre ton email — tu recevras un lien magique pour te connecter.
            <br />
            <span className="text-xs">
              (en dev, le lien est imprimé dans la console du serveur)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={login} className="flex flex-col gap-3">
            <Input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoFocus
              autoComplete="email"
            />
            <Button type="submit">Recevoir le lien magique</Button>
          </form>
          {adminEmail && (
            <form action={adminLogin}>
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
