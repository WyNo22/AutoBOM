import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="h-12 border-b border-white/5 flex items-center justify-between px-5" style={{ background: "rgba(7,7,26,0.8)", backdropFilter: "blur(12px)" }}>
      <div className="text-xs text-muted-foreground/60 font-mono tracking-wide" />
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="text-xs text-muted-foreground/70 hidden sm:block font-mono">{userEmail}</span>
        )}
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
            Déconnexion
          </Button>
        </form>
      </div>
    </header>
  );
}
