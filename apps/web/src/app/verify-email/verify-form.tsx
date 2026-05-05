"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { confirmEmailVerification, type VerifyState } from "./actions";

export function VerifyForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<VerifyState, FormData>(confirmEmailVerification, null);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Validation..." : "Valider mon compte"}
      </Button>
      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
    </form>
  );
}
