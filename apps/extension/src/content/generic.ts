import type { CapturedProduct, KnownSupplierSite } from "@autbom/shared";

type JsonLdProduct = {
  "@type"?: string | string[];
  name?: string;
  sku?: string;
  mpn?: string;
  offers?: { price?: string | number; priceCurrency?: string } | Array<{ price?: string | number; priceCurrency?: string }>;
};

type SupplierRule = {
  pattern: RegExp;
  name: string;
  site: KnownSupplierSite;
};

const SUPPLIER_RULES: SupplierRule[] = [
  { pattern: /xometry\./i, name: "Xometry", site: "xometry" },
  { pattern: /leroymerlin\./i, name: "Leroy Merlin", site: "leroymerlin" },
  { pattern: /bricovis\./i, name: "Bricovis", site: "bricovis" },
  { pattern: /123roulements\./i, name: "123Roulements", site: "123roulements" },
  { pattern: /norelem\./i, name: "Norelem", site: "norelem" },
  { pattern: /aliexpress\./i, name: "AliExpress", site: "aliexpress" },
  { pattern: /alibaba\./i, name: "Alibaba", site: "alibaba" },
  { pattern: /ebay\./i, name: "eBay", site: "ebay" },
  { pattern: /leboncoin\./i, name: "Leboncoin", site: "leboncoin" },
  { pattern: /manomano\./i, name: "ManoMano", site: "manomano" },
  { pattern: /conrad\./i, name: "Conrad", site: "conrad" },
  { pattern: /farnell\.|element14\./i, name: "Farnell", site: "farnell" },
  { pattern: /mouser\./i, name: "Mouser", site: "mouser" },
  { pattern: /digikey\./i, name: "Digi-Key", site: "digikey" },
  { pattern: /wurth\./i, name: "Würth", site: "wurth" },
  { pattern: /bricozor\./i, name: "Bricozor", site: "bricozor" },
  { pattern: /bricodepot\./i, name: "Brico Dépôt", site: "bricodepot" },
  { pattern: /castorama\./i, name: "Castorama", site: "castorama" },
  { pattern: /igus\./i, name: "igus", site: "igus" },
  { pattern: /festo\./i, name: "Festo", site: "festo" },
  { pattern: /smc\./i, name: "SMC", site: "smc" },
];

function text(selector: string): string | undefined {
  return document.querySelector<HTMLElement>(selector)?.innerText?.trim() || undefined;
}

function meta(selector: string): string | undefined {
  return document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;
}

function parsePrice(raw?: string | number): number | undefined {
  if (raw == null) return undefined;
  const value = String(raw).match(/[\d\s.,]+/)?.[0]?.replace(/\s/g, "").replace(",", ".");
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function jsonLdProducts(): JsonLdProduct[] {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));
  const products: JsonLdProduct[] = [];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent ?? "");
      const nodes = Array.isArray(parsed) ? parsed : parsed?.["@graph"] ?? [parsed];
      for (const node of nodes) {
        const type = node?.["@type"];
        const types = Array.isArray(type) ? type : [type];
        if (types.some((t) => String(t).toLowerCase() === "product")) products.push(node);
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return products;
}

function firstOffer(product?: JsonLdProduct) {
  const offers = product?.offers;
  return Array.isArray(offers) ? offers[0] : offers;
}

function supplierFromHost() {
  const host = location.hostname;
  const rule = SUPPLIER_RULES.find((r) => r.pattern.test(host));
  if (rule) return rule;
  const clean = host.replace(/^www\./, "").split(".")[0];
  const name = clean.charAt(0).toUpperCase() + clean.slice(1);
  return { name, site: "generic" as KnownSupplierSite };
}

function hasBuyIntent() {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("button, a, input[type='submit']"));
  return candidates.some((el) => /ajouter|panier|acheter|commander|add to cart|buy now|add basket|checkout/i.test(el.innerText || el.getAttribute("value") || el.getAttribute("aria-label") || ""));
}

function productScore(product?: JsonLdProduct) {
  let score = 0;
  if (product) score += 4;
  if (document.querySelector("h1")) score += 1;
  if (extractPrice(product) != null) score += 2;
  if (extractRef(product)) score += 1;
  if (hasBuyIntent()) score += 2;
  if (/\/((product|produit|item|dp|p|annonces?|catalogue|shop)\/|itm\/)/i.test(location.pathname)) score += 1;
  return score;
}

function extractTitle(product?: JsonLdProduct) {
  return product?.name || meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]') || text("h1");
}

function extractRef(product?: JsonLdProduct) {
  return product?.sku || product?.mpn || text('[itemprop="sku"], [class*="sku"], [class*="Sku"], [class*="reference"], [class*="Reference"], [data-testid*="sku"], [data-testid*="ref"]')?.replace(/^(sku|réf\.?|ref\.?|reference)\s*:?\s*/i, "");
}

function extractPrice(product?: JsonLdProduct) {
  const offerPrice = parsePrice(firstOffer(product)?.price);
  if (offerPrice != null) return offerPrice;
  return parsePrice(
    document.querySelector<HTMLElement>('[itemprop="price"], [class*="price"], [class*="Price"], [data-testid*="price"]')?.getAttribute("content") ||
      text('[itemprop="price"], [class*="price"], [class*="Price"], [data-testid*="price"]')
  );
}

function extract(): CapturedProduct | null {
  const product = jsonLdProducts()[0];
  if (productScore(product) < 4) return null;
  const designation = extractTitle(product);
  if (!designation) return null;
  const supplier = supplierFromHost();
  return {
    designation,
    supplierRef: extractRef(product),
    productUrl: location.href,
    unitPriceHT: extractPrice(product),
    supplierName: supplier.name,
    site: supplier.site,
  };
}

function injectButton() {
  if (document.getElementById("autobom-capture-btn")) return;
  if (!extract()) return;
  const btn = document.createElement("button");
  btn.id = "autobom-capture-btn";
  btn.textContent = "📋 Envoyer vers AutoBOM";
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "99999",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,.25)",
  });
  btn.addEventListener("click", () => {
    const data = extract();
    if (!data) {
      alert("AutoBOM : cette page ne ressemble plus à une page produit.");
      return;
    }
    chrome.runtime.sendMessage({ type: "AUTOBOM_CAPTURE", payload: data });
    btn.textContent = "✓ Capturé !";
    btn.style.background = "#16a34a";
    setTimeout(() => {
      btn.textContent = "📋 Envoyer vers AutoBOM";
      btn.style.background = "#2563eb";
    }, 2000);
  });
  document.body.appendChild(btn);
}

function scheduleInject() {
  setTimeout(injectButton, 700);
  setTimeout(injectButton, 2000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleInject);
} else {
  scheduleInject();
}

new MutationObserver(() => injectButton()).observe(document.documentElement, { childList: true, subtree: true });
