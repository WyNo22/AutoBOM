import type { CapturedProduct } from "@autbom/shared";

function extract(): Omit<CapturedProduct, "site" | "supplierName"> | null {
  const designation = document.getElementById("productTitle")?.innerText?.trim();
  if (!designation) return null;

  const supplierRef =
    document.querySelector<HTMLElement>('[data-asin]')?.dataset.asin ||
    document.querySelector<HTMLElement>('[data-csa-c-asin]')?.dataset.csaCAsin ||
    undefined;

  // Prix : sélection la valeur HT si disponible, sinon le prix affiché
  const priceWhole = document.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "");
  const priceFraction = document.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "");
  let unitPriceHT: number | undefined;
  if (priceWhole) {
    unitPriceHT = parseFloat(`${priceWhole}.${priceFraction ?? "00"}`)
    // Amazon prices are TTC, roughly divide by 1.2 for HT estimate
    if (unitPriceHT) unitPriceHT = Math.round((unitPriceHT / 1.2) * 100) / 100;
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
    const payload: CapturedProduct = { ...data, supplierName: "Amazon", site: "amazon" };
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
