"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UserResult = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  image: string | null;
};

function getInitials(user: UserResult): string {
  const first = user.firstName ?? user.name?.split(" ")[0] ?? user.email[0];
  const last = user.lastName ?? user.name?.split(" ")[1] ?? "";
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface MemberSearchProps {
  teamId: string;
  onSelect: (user: UserResult) => void;
  className?: string;
}

export function MemberSearch({ teamId: _teamId, onSelect, className }: MemberSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<UserResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function search(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json() as { users: UserResult[] };
          setResults(data.users ?? []);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(user: UserResult) {
    setQuery(user.email);
    setOpen(false);
    setResults([]);
    onSelect(user);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Email, prénom ou nom"
          className="pl-8 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-md border border-border bg-card shadow-md py-1 max-h-64 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-muted-foreground">Recherche…</div>}
          {results.map((user) => {
            const displayName = user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
            const initials = getInitials(user);
            const color = avatarColor(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left"
              >
                {user.image ? (
                  <img src={user.image} alt={displayName} className="size-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={cn("size-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0", color)}>
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
