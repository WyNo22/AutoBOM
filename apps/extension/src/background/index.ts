import type { CapturedProduct } from "@autbom/shared";

const DEFAULT_BASE = "https://auto-bom-web-soh3.vercel.app";

/** Read settings from chrome.storage.local */
async function getSettings(): Promise<{ baseUrl: string; token: string }> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["autobom_base", "autobom_token"], (res) => {
      resolve({
        baseUrl: (res.autobom_base as string) ?? DEFAULT_BASE,
        token: (res.autobom_token as string) ?? "",
      });
    });
  });
}

/** Store the latest captured product so the popup can display it */
function storePending(payload: CapturedProduct, bomId?: string) {
  chrome.storage.local.set({ autobom_pending: JSON.stringify({ payload, bomId }) });
}

/** Send the captured product to AUTBOM API */
async function sendCapture(payload: CapturedProduct, bomId: string): Promise<boolean> {
  const { baseUrl, token } = await getSettings();
  try {
    const res = await fetch(`${baseUrl}/api/boms/${bomId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({
        designation: payload.designation,
        supplierRef: payload.supplierRef,
        productUrl: payload.productUrl,
        unitPriceHT: payload.unitPriceHT,
        qty: payload.qty ?? 1,
        notes: payload.notes,
        supplierName: payload.supplierName,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "AUTOBOM_CAPTURE") {
    const payload = msg.payload as CapturedProduct;
    // Store pending so the popup can pick the BOM
    storePending(payload);
    // Open the popup automatically (badge)
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#2563eb" });
    sendResponse({ ok: true });
  }

  if (msg.type === "AUTOBOM_SEND") {
    const { payload, bomId } = msg as { type: string; payload: CapturedProduct; bomId: string };
    sendCapture(payload, bomId).then((ok) => {
      if (ok) {
        chrome.storage.local.remove("autobom_pending");
        chrome.action.setBadgeText({ text: "" });
      }
      sendResponse({ ok });
    });
    return true; // async
  }

  if (msg.type === "AUTOBOM_CLEAR") {
    chrome.storage.local.remove("autobom_pending");
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ ok: true });
  }
});

console.log("[AutoBOM] background worker loaded");
