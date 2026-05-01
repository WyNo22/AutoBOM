import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">
        {/* Placeholder for breadcrumbs (Sprint 1) */}
      </div>
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-sm text-muted-foreground hidden sm:block">{userEmail}</span>
        )}
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Déconnexion
          </Button>
        </form>
      </div>
    </header>
  );
}
