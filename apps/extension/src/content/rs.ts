import type { CapturedProduct } from "@autbom/shared";

function extract(): Omit<CapturedProduct, "site" | "supplierName"> | null {
  const designation =
    document.querySelector<HTMLElement>("h1[itemprop='name'], .product-title, [class*='ProductTitle']")
      ?.innerText?.trim() ??
    document.querySelector<HTMLElement>("h1")?.innerText?.trim();
  if (!designation) return null;

  // RS ref is typically in the URL or a visible span like "Ref. RS: 123-4567"
  const refEl = document.querySelector<HTMLElement>(
    "[class*='stock-no'], [class*='StockNo'], [data-testid='product-reference']"
  );
  const supplierRef =
    refEl?.innerText?.replace(/[^\w-]/g, "").trim() ||
    location.pathname.match(/\/p\/([^/]+)/)?.[1] ||
    undefined;

  const priceEl = document.querySelector<HTMLElement>(
    "[class*='price-value'], [class*='PriceValue'], [itemprop='price']"
  );
  let unitPriceHT: number | undefined;
  if (priceEl) {
    const raw = priceEl.getAttribute("content") ?? priceEl.innerText;
    const m = raw.match(/([\d.,]+)/);
    if (m) unitPriceHT = parseFloat(m[1].replace(",", ".")) || undefined;
  }

  return { designation, supplierRef, productUrl: location.href, unitPriceHT };
}

function injectButton() {
  if (document.getElementById("autobom-capture-btn")) return;
  const btn = document.createElement("button");
  btn.id = "autobom-capture-btn";
  btn.textContent = "📋 Envoyer vers AutoBOM";
  Object.assign(btn.style, {
    position: "fixed", bottom: "24px", right: "24px", zIndex: "99999",
    background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 16px", fontSize: "13px", fontWeight: "600",
    cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,.25)",
  });
  btn.addEventListener("click", () => {
    const data = extract();
    if (!data) { alert("AutoBOM : impossible d'extraire les données produit."); return; }
    const payload: CapturedProduct = { ...data, supplierName: "RS Components", site: "rs" };
    chrome.runtime.sendMessage({ type: "AUTOBOM_CAPTURE", payload });
    btn.textContent = "✓ Capturé !";
    btn.style.background = "#16a34a";
    setTimeout(() => { btn.textContent = "📋 Envoyer vers AutoBOM"; btn.style.background = "#2563eb"; }, 2000);
  });
  document.body.appendChild(btn);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton);
} else {
  injectButton();
}
