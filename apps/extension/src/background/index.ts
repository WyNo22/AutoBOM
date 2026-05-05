// AutoBOM service worker
// All capture logic happens in the popup (via scripting.executeScript on the active tab).
// The popup then opens the AutoBOM /capture page in a new tab with the product data
// passed as URL parameters. No API calls are made from the extension itself, so no
// host_permissions are required.
console.log("[AutoBOM] background worker loaded");
export {};
