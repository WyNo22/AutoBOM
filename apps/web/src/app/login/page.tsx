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

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
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
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
