import Link from "next/link";
import { FolderKanban, Truck, ShoppingCart, CheckSquare, Settings } from "lucide-react";

const NAV = [
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/suppliers", label: "Fournisseurs", icon: Truck },
  { href: "/carts", label: "Paniers", icon: ShoppingCart },
  { href: "/validations", label: "Validations", icon: CheckSquare },
  { href: "/settings", label: "Réglages", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link href="/projects" className="font-semibold tracking-tight">
          AutoBOM
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 text-xs text-muted-foreground border-t border-border">
        v0.1.0 · AutoBOM
      </div>
    </aside>
  );
}
