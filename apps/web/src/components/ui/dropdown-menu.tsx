"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Context ────────────────────────────────────────────────────────────────

type DropdownCtx = { open: boolean; setOpen: (v: boolean) => void };
const Ctx = React.createContext<DropdownCtx>({ open: false, setOpen: () => {} });

// ─── Root ────────────────────────────────────────────────────────────────────

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </Ctx.Provider>
  );
}

// ─── Trigger ─────────────────────────────────────────────────────────────────

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { open, setOpen } = React.useContext(Ctx);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
      },
    });
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
    >
      {children}
    </button>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

export function DropdownMenuContent({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const { open, setOpen } = React.useContext(Ctx);
  if (!open) return null;
  return (
    <div
      className={cn(
        "absolute top-full mt-1 z-50 min-w-[160px] rounded-md border border-border bg-card shadow-md py-1",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  );
}

// ─── Item ─────────────────────────────────────────────────────────────────────

export function DropdownMenuItem({
  children,
  onClick,
  className,
  destructive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent transition-colors",
        destructive && "text-destructive hover:bg-destructive/10",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
