"use client";

import { useState } from "react";

export function TestMailForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; payload: unknown } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/debug/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim() }),
      });
      const payload = await response.json().catch(() => ({ error: "Invalid JSON response" }));
      setResult({ ok: response.ok, payload });
    } catch (error) {
      setResult({ ok: false, payload: { error: error instanceof Error ? error.message : String(error) } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="votre-email@exemple.com"
          className="flex-1 rounded border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Envoyer un test"}
        </button>
      </div>
      {result ? (
        <div className={`rounded border p-3 text-sm ${result.ok ? "border-green-500 text-green-700" : "border-red-500 text-red-700"}`}>
          <div className="font-semibold">{result.ok ? "Mail envoyé" : "Échec de l'envoi"}</div>
          <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(result.payload, null, 2)}</pre>
        </div>
      ) : null}
    </form>
  );
}
