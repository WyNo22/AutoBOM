/**
 * AutoBOM extension popup.
 *
 * Flow:
 *  1. User clicks the extension icon on any page.
 *  2. Popup uses chrome.scripting.executeScript (granted by activeTab) to extract
 *     product data from the current tab. No host_permissions are required.
 *  3. Extracted product is shown in the popup.
 *  4. User clicks "Ouvrir dans AutoBOM" → a new tab opens at {base}/capture?p=...
 *     with the product data encoded in the URL.
 *  5. The AutoBOM web app handles BOM selection and the actual API call.
 */

type ExtractedProduct = {
  designation: string;
  supplierName: string;
  supplierRef?: string;
  productUrl: string;
  unitPriceHT?: number;
};

const DEFAULT_BASE = "https://auto-bom-web-soh3.vercel.app";

// ── DOM refs ────────────────────────────────────────────────────────────────
const viewLoading  = document.getElementById("view-loading")!;
const viewProduct  = document.getElementById("view-product")!;
const viewEmpty    = document.getElementById("view-empty")!;
const viewSettings = document.getElementById("view-settings")!;
const capName      = document.getElementById("cap-name")!;
const capSupplier  = document.getElementById("cap-supplier")!;
const capRef       = document.getElementById("cap-ref")!;
const capPrice     = document.getElementById("cap-price")!;
const btnSend      = document.getElementById("btn-send") as HTMLButtonElement;
const btnSettings  = document.getElementById("btn-settings-toggle")!;
const inputBase    = document.getElementById("input-base") as HTMLInputElement;
const btnSave      = document.getElementById("btn-save-settings")!;
const btnOpenApp   = document.getElementById("btn-open-app") as HTMLButtonElement;

// ── Helpers ─────────────────────────────────────────────────────────────────
function show(el: HTMLElement) { el.classList.remove("hidden"); }
function hide(el: HTMLElement) { el.classList.add("hidden"); }
function hideAll() { hide(viewLoading); hide(viewProduct); hide(viewEmpty); }

function getBase(): Promise<string> {
  return new Promise((res) => {
    chrome.storage.local.get("autobom_base", (r) => {
      res((r.autobom_base as string) ?? DEFAULT_BASE);
    });
  });
}

// ── Page extractor ──────────────────────────────────────────────────────────
// This function is serialised and run inside the active tab. It cannot import
// anything; everything must be inline.
function extractFromPage(): ExtractedProduct | null {
  const url = location.href;
  const host = location.hostname.replace(/^www\./, "");

  function priceFromText(text: string | null | undefined): number | undefined {
    if (!text) return undefined;
    const m = text.replace(/\s/g, "").match(/(\d+[.,]?\d*)/);
    if (!m) return undefined;
    const n = parseFloat(m[1].replace(",", "."));
    return isNaN(n) || n <= 0 || n > 1_000_000 ? undefined : n;
  }

  // ── Amazon ────────────────────────────────────────────────────────────────
  if (host.includes("amazon.")) {
    const designation = (document.getElementById("productTitle") as HTMLElement | null)?.innerText?.trim();
    if (!designation) return null;
    const asin =
      (document.querySelector("[data-asin]") as HTMLElement | null)?.dataset?.asin ||
      (document.querySelector("[data-csa-c-asin]") as HTMLElement | null)?.dataset?.csaCAsin ||
      undefined;
    const whole = document.querySelector(".a-price-whole")?.textContent?.replace(/[^\d]/g, "");
    const frac  = document.querySelector(".a-price-fraction")?.textContent?.replace(/[^\d]/g, "");
    let price: number | undefined;
    if (whole) {
      const ttc = parseFloat(`${whole}.${frac ?? "00"}`);
      price = ttc ? Math.round((ttc / 1.2) * 100) / 100 : undefined;
    }
    return { designation, supplierRef: asin, productUrl: url, unitPriceHT: price, supplierName: "Amazon" };
  }

  // ── AliExpress ────────────────────────────────────────────────────────────
  if (host.includes("aliexpress.")) {
    const titleEl =
      document.querySelector('h1[data-pl="product-title"]') ||
      document.querySelector(".pdp-info h1") ||
      document.querySelector("h1");
    const designation = titleEl?.textContent?.trim();
    if (!designation || designation.length < 3) return null;
    const priceEl =
      document.querySelector(".product-price-value") ||
      document.querySelector('[class*="price-default"]') ||
      document.querySelector('[class*="price"]');
    const price = priceFromText(priceEl?.textContent);
    return { designation, productUrl: url, unitPriceHT: price, supplierName: "AliExpress" };
  }

  // ── Tolery ────────────────────────────────────────────────────────────────
  if (host.includes("tolery.")) {
    const designation = document.querySelector("h1")?.textContent?.trim();
    if (!designation) return null;
    const refEl = document.querySelector('[class*="reference" i]');
    const supplierRef = refEl?.textContent?.replace(/r[ée]f[ée]rence\s*:?\s*/i, "").trim() || undefined;
    const priceEl = document.querySelector('[class*="price" i]');
    const price = priceFromText(priceEl?.textContent);
    return { designation, supplierRef, productUrl: url, unitPriceHT: price, supplierName: "Tolery" };
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim();
  const h1 = document.querySelector("h1")?.textContent?.trim();
  const designation = ogTitle || h1;
  if (!designation || designation.length < 3) return null;

  const priceEl =
    document.querySelector('[itemprop="price"]') ||
    document.querySelector('meta[property="product:price:amount"]') ||
    document.querySelector('[class*="price" i]');
  const priceContent =
    priceEl?.getAttribute("content") ?? priceEl?.textContent ?? null;
  const price = priceFromText(priceContent);

  const supplierName = host.split(".")[0]
    .replace(/^\w/, (c) => c.toUpperCase());

  return { designation, productUrl: url, unitPriceHT: price, supplierName };
}

// ── Run extractor on the active tab ─────────────────────────────────────────
async function extractCurrentTab(): Promise<ExtractedProduct | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;

  // Restrict to http(s) pages — chrome:// and similar will throw.
  if (!tab.url || !/^https?:/.test(tab.url)) return null;

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFromPage,
    });
    return (results[0]?.result as ExtractedProduct | null) ?? null;
  } catch (err) {
    console.warn("[AutoBOM] extraction failed:", err);
    return null;
  }
}

// ── Encode product into a URL-safe string ───────────────────────────────────
function encodeProduct(p: ExtractedProduct): string {
  const json = JSON.stringify(p);
  // base64url so it can travel safely in a query string
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Renderers ───────────────────────────────────────────────────────────────
function renderProduct(p: ExtractedProduct) {
  capName.textContent = p.designation;
  capSupplier.textContent = p.supplierName;
  capRef.textContent = p.supplierRef ? `Réf : ${p.supplierRef}` : "";
  if (p.unitPriceHT) {
    capPrice.textContent = `${p.unitPriceHT.toFixed(2)} € HT`;
    show(capPrice);
  } else {
    hide(capPrice);
  }
  hideAll();
  show(viewProduct);
}

function renderEmpty() {
  hideAll();
  show(viewEmpty);
}

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
  const base = await getBase();
  inputBase.value = base;

  hideAll();
  show(viewLoading);

  const product = await extractCurrentTab();
  if (!product) {
    renderEmpty();
    return;
  }
  renderProduct(product);

  btnSend.addEventListener("click", async () => {
    const baseNow = await getBase();
    const url = `${baseNow}/capture?p=${encodeProduct(product)}`;
    await chrome.tabs.create({ url });
    window.close();
  });
}

// ── Settings toggle ─────────────────────────────────────────────────────────
btnSettings.addEventListener("click", (e) => {
  e.preventDefault();
  viewSettings.classList.toggle("hidden");
});

btnOpenApp.addEventListener("click", async () => {
  const base = await getBase();
  await chrome.tabs.create({ url: base });
  window.close();
});

btnSave.addEventListener("click", () => {
  const base = inputBase.value.trim().replace(/\/$/, "");
  chrome.storage.local.set({ autobom_base: base }, () => {
    btnSave.textContent = "Enregistré ✓";
    setTimeout(() => { btnSave.textContent = "Enregistrer l'URL"; }, 1500);
  });
});

init();
