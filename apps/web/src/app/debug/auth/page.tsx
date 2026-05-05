import { TestMailForm } from "./test-mail-form";

async function getDiagnostics() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/debug/auth`, { cache: "no-store" });
  const data = await response.json().catch(() => ({ error: "Invalid JSON response" }));
  return { status: response.status, data };
}

export default async function AuthDebugPage() {
  const diagnostics = await getDiagnostics();
  const checks = Array.isArray(diagnostics.data.checks) ? diagnostics.data.checks : [];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Diagnostic Auth / DB</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page vérifie la connexion Supabase/Postgres, les tables Auth et la configuration mail.
        </p>
      </div>

      <section className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-xl font-semibold">Résumé</h2>
        <div className={diagnostics.data.ok ? "text-green-700" : "text-red-700"}>
          {diagnostics.data.ok ? "OK — les checks principaux passent" : "Erreur — au moins un check échoue"}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">HTTP {diagnostics.status}</div>
      </section>

      <section className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-xl font-semibold">Environnement</h2>
        <pre className="overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(diagnostics.data.environment ?? diagnostics.data, null, 2)}
        </pre>
      </section>

      <section className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-xl font-semibold">Tester l&apos;envoi mail</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Envoie un email de test via le driver configuré ({diagnostics.data.environment?.mailDriver ?? "inconnu"}).
        </p>
        <TestMailForm />
      </section>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-xl font-semibold">Checks</h2>
        <div className="space-y-3">
          {checks.map((check: { name: string; ok: boolean; error?: string; details?: unknown }) => (
            <div key={check.name} className="rounded border p-3">
              <div className="flex items-center justify-between gap-4">
                <strong>{check.name}</strong>
                <span className={check.ok ? "text-green-700" : "text-red-700"}>{check.ok ? "OK" : "FAIL"}</span>
              </div>
              {check.error ? <p className="mt-2 text-sm text-red-700">{check.error}</p> : null}
              {check.details ? (
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(check.details, null, 2)}</pre>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
