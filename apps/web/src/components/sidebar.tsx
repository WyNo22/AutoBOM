"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Truck, ShoppingCart, CheckSquare, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/teams", label: "Équipes", icon: Users },
  { href: "/suppliers", label: "Fournisseurs", icon: Truck },
  { href: "/carts", label: "Paniers", icon: ShoppingCart },
  { href: "/validations", label: "Validations", icon: CheckSquare },
  { href: "/settings", label: "Réglages", icon: Settings },
];

function AutobomLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="AutoBOM">
      <polygon points="14,2 26,24 2,24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" />
      <line x1="7" y1="18" x2="21" y2="18" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <line x1="10.5" y1="11" x2="14" y2="5" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17.5" y1="11" x2="14" y2="5" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 border-r border-white/5 flex flex-col" style={{ background: "#07071a" }}>
      <div className="h-14 flex items-center px-4 border-b border-white/5 gap-2.5">
        <AutobomLogo />
        <Link href="/projects" className="font-semibold tracking-tight text-sm text-foreground/90 hover:text-foreground transition-colors">
          AutoBOM
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/8 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-electric" />
              )}
              <Icon className={cn("size-4 shrink-0", active ? "text-electric" : "text-muted-foreground")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 text-xs text-muted-foreground/50 border-t border-white/5 font-mono">
        v0.1.0
      </div>
    </aside>
  );
}
