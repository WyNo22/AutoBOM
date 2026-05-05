import { NextResponse } from "next/server";
import { requireBomAccess, requireUserId } from "@/lib/auth-helpers";

export const runtime = "nodejs";

type ParsedQuery = {
  itemType: string;
  requiredTerms: string[];
  optionalTerms: string[];
  preferredSites: string[];
  queries: string[];
};

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type Suggestion = {
  title: string;
  supplier: string | null;
  url: string;
  priceHint: string | null;
  confidence: number;
  notes: string;
  matchedCriteria: string[];
  missingCriteria: string[];
};

const SITE_DOMAINS: Record<string, string[]> = {
  amazon: ["amazon.fr", "amazon.com"],
  aliexpress: ["aliexpress.com"],
  alibaba: ["alibaba.com"],
  ebay: ["ebay.fr", "ebay.com"],
  rs: ["fr.rs-online.com", "rs-online.com"],
  radiospares: ["fr.rs-online.com", "rs-online.com"],
  farnell: ["fr.farnell.com", "farnell.com"],
  mouser: ["mouser.fr", "mouser.com"],
  digikey: ["digikey.fr", "digikey.com"],
  manomano: ["manomano.fr"],
  conrad: ["conrad.fr"],
  misumi: ["misumi-ec.com"],
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function fallbackParsed(designation: string): ParsedQuery {
  const lower = designation.toLowerCase();
  const preferredSites = Object.keys(SITE_DOMAINS).filter((site) => lower.includes(site));
  const domains = preferredSites.flatMap((site) => SITE_DOMAINS[site] ?? []);
  const scoped = domains.length > 0 ? domains.map((domain) => `site:${domain} ${designation}`) : [];
  return {
    itemType: designation,
    requiredTerms: designation.split(/\s+/).filter(Boolean).slice(0, 8),
    optionalTerms: [],
    preferredSites,
    queries: [...scoped, designation].slice(0, 4),
  };
}

function supplierFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const match = Object.entries(SITE_DOMAINS).find(([, domains]) => domains.some((domain) => host.includes(domain)));
    if (match) return match[0][0].toUpperCase() + match[0].slice(1);
    return host.split(".")[0] || null;
  } catch {
    return null;
  }
}

function extractPrice(text: string): string | null {
  const match = text.match(/(?:€|EUR|eur)\s?\d+[\d\s,.]*|\d+[\d\s,.]*\s?(?:€|EUR|eur|\$|USD)/i);
  return match?.[0]?.trim() ?? null;
}

async function parseWithOpenAi(designation: string): Promise<ParsedQuery> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallbackParsed(designation);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Tu transformes une demande d'achat technique en JSON strict. Respecte les sites cités par l'utilisateur avec des requêtes site:domaine. Extrait dimensions, tension, matière, normes, compatibilités, filetage, longueur, diamètre et toute caractéristique obligatoire. Ne propose pas de produit inventé.",
        },
        {
          role: "user",
          content: `Demande: ${designation}\nRetourne JSON: {"itemType":"","requiredTerms":[],"optionalTerms":[],"preferredSites":[],"queries":[]} avec 2 à 4 requêtes web précises. Sites connus: ${Object.keys(SITE_DOMAINS).join(", ")}.`,
        },
      ],
    }),
  });

  if (!res.ok) return fallbackParsed(designation);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const parsed = safeJson<Partial<ParsedQuery>>(data.choices?.[0]?.message?.content ?? "{}", {});
  const fallback = fallbackParsed(designation);
  const preferredSites = Array.isArray(parsed.preferredSites) ? parsed.preferredSites.map(String) : fallback.preferredSites;
  const requiredTerms = Array.isArray(parsed.requiredTerms) ? parsed.requiredTerms.map(String) : fallback.requiredTerms;
  const optionalTerms = Array.isArray(parsed.optionalTerms) ? parsed.optionalTerms.map(String) : [];
  let queries = Array.isArray(parsed.queries) ? parsed.queries.map(String).filter(Boolean) : fallback.queries;
  const domains = preferredSites.flatMap((site) => SITE_DOMAINS[site.toLowerCase()] ?? []);
  if (domains.length > 0) {
    queries = queries.map((query) => /\bsite:/i.test(query) ? query : `site:${domains[0]} ${query}`);
  }
  return {
    itemType: typeof parsed.itemType === "string" && parsed.itemType ? parsed.itemType : fallback.itemType,
    requiredTerms,
    optionalTerms,
    preferredSites,
    queries: queries.slice(0, 4),
  };
}

async function searchTavily(queries: string[]): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY manquante");
  const seen = new Set<string>();
  const batches = await Promise.all(queries.map(async (query) => {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, query, search_depth: "basic", max_results: 5, include_answer: false }),
    });
    if (!res.ok) return [] as TavilyResult[];
    const data = await res.json() as { results?: TavilyResult[] };
    return data.results ?? [];
  }));
  return batches.flat().filter((result) => {
    if (!result.url || seen.has(result.url)) return false;
    seen.add(result.url);
    return true;
  });
}

async function rankWithOpenAi(designation: string, parsed: ParsedQuery, results: TavilyResult[]): Promise<Suggestion[]> {
  const key = process.env.OPENAI_API_KEY;
  const candidates = results.slice(0, 12).map((result) => ({
    title: result.title ?? "Produit",
    url: result.url ?? "",
    content: result.content ?? "",
    score: result.score ?? 0,
    supplier: result.url ? supplierFromUrl(result.url) : null,
    priceHint: extractPrice(`${result.title ?? ""} ${result.content ?? ""}`),
  }));

  function fallbackRank() {
    return candidates.slice(0, 3).map((candidate) => ({
      title: candidate.title,
      supplier: candidate.supplier,
      url: candidate.url,
      priceHint: candidate.priceHint,
      confidence: Math.round((candidate.score || 0.5) * 100),
      notes: candidate.content.slice(0, 220),
      matchedCriteria: parsed.requiredTerms.filter((term) => `${candidate.title} ${candidate.content}`.toLowerCase().includes(term.toLowerCase())),
      missingCriteria: [],
    }));
  }

  if (!key) return fallbackRank();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Classe des résultats web réels pour un achat technique. Ne garde que des URLs fournies. Retourne exactement 3 suggestions maximum en JSON strict.",
        },
        {
          role: "user",
          content: JSON.stringify({ designation, parsed, candidates, expected: { suggestions: [{ title: "", supplier: "", url: "", priceHint: null, confidence: 0, notes: "", matchedCriteria: [], missingCriteria: [] }] } }),
        },
      ],
    }),
  });

  if (!res.ok) return fallbackRank();
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const ranked = safeJson<{ suggestions?: Suggestion[] }>(data.choices?.[0]?.message?.content ?? "{}", {});
  const validUrls = new Set(candidates.map((candidate) => candidate.url));
  return (ranked.suggestions ?? [])
    .filter((suggestion) => suggestion.url && validUrls.has(suggestion.url))
    .slice(0, 3)
    .map((suggestion) => ({
      title: suggestion.title,
      supplier: suggestion.supplier || supplierFromUrl(suggestion.url),
      url: suggestion.url,
      priceHint: suggestion.priceHint ?? extractPrice(`${suggestion.title} ${suggestion.notes}`),
      confidence: Math.max(0, Math.min(100, Number(suggestion.confidence) || 0)),
      notes: suggestion.notes || "Résultat web réel trouvé par Tavily.",
      matchedCriteria: Array.isArray(suggestion.matchedCriteria) ? suggestion.matchedCriteria : [],
      missingCriteria: Array.isArray(suggestion.missingCriteria) ? suggestion.missingCriteria : [],
    }));
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { designation?: string; bomId?: string };
    const designation = String(body.designation ?? "").trim();
    if (designation.length < 3) return jsonError("Désignation trop courte");
    if (body.bomId) await requireBomAccess(String(body.bomId));
    else await requireUserId();

    const parsed = await parseWithOpenAi(designation);
    const results = await searchTavily(parsed.queries.length > 0 ? parsed.queries : [designation]);
    if (results.length === 0) return NextResponse.json({ parsed, suggestions: [], warning: "Aucun résultat web trouvé." });
    const suggestions = await rankWithOpenAi(designation, parsed, results);
    return NextResponse.json({ parsed, suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur sourcing";
    return jsonError(message, message.includes("manquante") ? 503 : 500);
  }
}
