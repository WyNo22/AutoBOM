import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePassword, updateProfile, deleteAccount } from "./actions";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    : null;
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>
      <p className="text-sm text-muted-foreground">Connecté en tant que {session?.user?.email}.</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="grid gap-3 sm:grid-cols-2">
            <Input name="firstName" placeholder="Prénom" defaultValue={user?.firstName ?? ""} required />
            <Input name="lastName" placeholder="Nom" defaultValue={user?.lastName ?? ""} required />
            <Button type="submit" className="sm:col-span-2">Enregistrer le profil</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePassword} className="flex flex-col gap-3">
            <Input type="password" name="current" placeholder="Mot de passe actuel (si défini)" autoComplete="current-password" />
            <Input type="password" name="password" placeholder="Nouveau mot de passe" minLength={8} required autoComplete="new-password" />
            <Input type="password" name="confirm" placeholder="Confirmer le nouveau mot de passe" minLength={8} required autoComplete="new-password" />
            <Button type="submit">Mettre à jour le mot de passe</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">La suppression de ton compte est irréversible. Toutes tes données seront perdues.</p>
          <form action={deleteAccount} onSubmit={(e) => { if (!confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) e.preventDefault(); }}>
            <Button type="submit" variant="destructive">Supprimer mon compte</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
