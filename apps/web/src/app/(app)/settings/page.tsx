import { auth } from "@/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePassword, updateProfile, updateEmail } from "./actions";
import { AvatarUpload } from "./avatar-upload";
import { AiToggle } from "./ai-toggle";
import { DeleteAccountDialog } from "./delete-account-dialog";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
    : null;

  const displayName = user?.name || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || session?.user?.email || "?";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>

      {/* ── Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo de profil</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload currentImage={user?.image ?? null} name={displayName} />
        </CardContent>
      </Card>

      {/* ── Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateProfile} className="grid gap-3 sm:grid-cols-2">
            <Input name="firstName" placeholder="Prénom" defaultValue={user?.firstName ?? ""} required />
            <Input name="lastName" placeholder="Nom" defaultValue={user?.lastName ?? ""} required />
            <Button type="submit" className="sm:col-span-2">Enregistrer</Button>
          </form>
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">Adresse e-mail (actuelle : {user?.email})</p>
            <form action={updateEmail} className="flex gap-2">
              <Input name="email" type="email" placeholder="Nouvelle adresse e-mail" className="flex-1" />
              <Button type="submit" variant="outline" size="sm">Modifier</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* ── Password */}
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

      {/* ── AI preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Préférences IA</CardTitle>
        </CardHeader>
        <CardContent>
          <AiToggle initialEnabled={user?.aiSourcingEnabled ?? true} />
        </CardContent>
      </Card>

      {/* ── Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            La suppression de ton compte est irréversible. Tous tes projets, BOMs, équipes et fichiers seront définitivement effacés.
          </p>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}
