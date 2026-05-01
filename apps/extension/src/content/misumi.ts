import type { CapturedProduct } from "@autbom/shared";

function extract(): Omit<CapturedProduct, "site" | "supplierName"> | null {
  const designation =
    document.querySelector<HTMLElement>(".product-name, h1.pdp-title, [class*='ProductName']")
      ?.innerText?.trim() ??
    document.querySelector<HTMLElement>("h1")?.innerText?.trim();
  if (!designation) return null;

  const supplierRef =
    document.querySelector<HTMLElement>(".pn-input, [class*='part-number'], [id*='partNumber']")
      ?.innerText?.replace(/[^\w-]/g, "").trim() ||
    new URLSearchParams(location.search).get("pn") ||
    undefined;

  const priceEl = document.querySelector<HTMLElement>(
    "[class*='price-value'], [class*='unit-price'], .price .amount"
  );
  let unitPriceHT: number | undefined;
  if (priceEl) {
    const m = priceEl.innerText.match(/([\d\s.,]+)/);
    if (m) unitPriceHT = parseFloat(m[1].replace(/\s/g, "").replace(",", ".")) || undefined;
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
    const payload: CapturedProduct = { ...data, supplierName: "Misumi", site: "misumi" };
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
