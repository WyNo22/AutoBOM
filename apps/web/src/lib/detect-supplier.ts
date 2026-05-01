/**
 * Given a product URL, returns the canonical supplier name (or null).
 * Works 100% client-side — no API call.
 */
export interface DetectedSupplier {
  name: string;
  /** key used in `suppliers.knownSite` column */
  knownSite: string;
}

const RULES: { pattern: RegExp; name: string; knownSite: string }[] = [
  { pattern: /tolery\.com/i, name: "Tolery", knownSite: "tolery" },
  { pattern: /amazon\.(fr|com|de|co\.uk|es|it)/i, name: "Amazon", knownSite: "amazon" },
  { pattern: /misumi/i, name: "Misumi", knownSite: "misumi" },
  { pattern: /rs-online\.com|rsonline\.fr/i, name: "RS Components", knownSite: "rs" },
  { pattern: /mouser\./i, name: "Mouser", knownSite: "mouser" },
  { pattern: /digikey\./i, name: "Digi-Key", knownSite: "digikey" },
  { pattern: /farnell\.|element14\./i, name: "Farnell", knownSite: "farnell" },
  { pattern: /conrad\./i, name: "Conrad", knownSite: "conrad" },
  { pattern: /wurth-elektronik\.|we-online\./i, name: "Würth Elektronik", knownSite: "wurth" },
  { pattern: /lcsc\.com/i, name: "LCSC", knownSite: "lcsc" },
  { pattern: /aliexpress\./i, name: "AliExpress", knownSite: "aliexpress" },
  { pattern: /alibaba\./i, name: "Alibaba", knownSite: "alibaba" },
  { pattern: /mcmaster\.com/i, name: "McMaster-Carr", knownSite: "mcmaster" },
  { pattern: /grainger\./i, name: "Grainger", knownSite: "grainger" },
  { pattern: /smc(-pneumatics)?\./i, name: "SMC", knownSite: "smc" },
  { pattern: /festo\./i, name: "Festo", knownSite: "festo" },
  { pattern: /igus\./i, name: "igus", knownSite: "igus" },
  { pattern: /norelem\./i, name: "Norelem", knownSite: "norelem" },
  { pattern: /radiospares\.fr|rs-components/i, name: "RS Components", knownSite: "rs" },
];

export function detectSupplierFromUrl(url: string): DetectedSupplier | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname;
    for (const rule of RULES) {
      if (rule.pattern.test(host)) {
        return { name: rule.name, knownSite: rule.knownSite };
      }
    }
  } catch {
    // Invalid URL — ignore
  }
  return null;
}
