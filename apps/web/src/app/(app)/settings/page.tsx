import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>
      <p className="text-sm text-muted-foreground">Connecté en tant que {session?.user?.email}.</p>
    </div>
  );
}
