"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toggleAiSourcing } from "./actions";

export function AiToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [pending, setPending] = React.useState(false);

  async function handleChange(val: boolean) {
    setEnabled(val);
    setPending(true);
    try {
      await toggleAiSourcing(val);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Suggestions IA lors du sourçage</p>
          <p className="text-xs text-muted-foreground">
            Active les recommandations automatiques quand tu appuies sur Entrée dans la désignation.
          </p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={handleChange} disabled={pending} />
    </div>
  );
}
