import type { CapturedProduct } from "@autbom/shared";

type BomRow = {
  bomId: string;
  bomName: string;
  bomStatus: string;
  projectId: string;
  projectName: string;
};

type Pending = { payload: CapturedProduct; bomId?: string };

// ── DOM refs
const viewCapture = document.getElementById("view-capture")!;
const viewEmpty = document.getElementById("view-empty")!;
const viewLogin = document.getElementById("view-login")!;
const viewSettings = document.getElementById("view-settings")!;
const capName = document.getElementById("cap-name")!;
const capSupplier = document.getElementById("cap-supplier")!;
const capRef = document.getElementById("cap-ref")!;
const capPrice = document.getElementById("cap-price")!;
const bomSelect = document.getElementById("bom-select") as HTMLSelectElement;
const btnSend = document.getElementById("btn-send") as HTMLButtonElement;
const btnDiscard = document.getElementById("btn-discard")!;
const sendStatus = document.getElementById("send-status")!;
const btnSettingsToggle = document.getElementById("btn-settings-toggle")!;
const inputBase = document.getElementById("input-base") as HTMLInputElement;
const btnSaveSettings = document.getElementById("btn-save-settings")!;
const btnLogin = document.getElementById("btn-login") as HTMLButtonElement;
const btnLoginMain = document.getElementById("btn-login-main") as HTMLButtonElement;
const btnRefreshSession = document.getElementById("btn-refresh-session") as HTMLButtonElement;
const connStatus = document.getElementById("conn-status")!;

// ── Helpers
function show(el: HTMLElement) { el.classList.remove("hidden"); }
function hide(el: HTMLElement) { el.classList.add("hidden"); }
function hideMainViews() {
  hide(viewCapture);
  hide(viewEmpty);
  hide(viewLogin);
}
function setStatus(msg: string, type: "ok" | "err") {
  sendStatus.textContent = msg;
  sendStatus.className = `status ${type}`;
  show(sendStatus);
}

function getBase(): Promise<string> {
  return new Promise((res) => {
    chrome.storage.local.get("autobom_base", (r) => {
      res((r.autobom_base as string) ?? "https://auto-bom-web-soh3.vercel.app");
    });
  });
}

async function isConnected(base: string): Promise<boolean> {
  try {
    const r = await fetch(`${base}/api/me/boms`, { credentials: "include" });
    return r.ok;
  } catch {
    return false;
  }
}

async function openLogin() {
  const base = await getBase();
  chrome.tabs.create({ url: `${base}/login` });
}

// ── Load BOMs from API
async function loadBoms(base: string) {
  try {
    const r = await fetch(`${base}/api/me/boms`, { credentials: "include" });
    if (!r.ok) throw new Error("auth");
    const { boms } = (await r.json()) as { boms: BomRow[] };

    bomSelect.innerHTML = "";
    if (!boms.length) {
      bomSelect.innerHTML = "<option value=''>Aucune BOM trouvée</option>";
      return;
    }

    // Group by project
    const byProject = new Map<string, { name: string; boms: BomRow[] }>();
    for (const b of boms) {
      if (!byProject.has(b.projectId))
        byProject.set(b.projectId, { name: b.projectName, boms: [] });
      byProject.get(b.projectId)!.boms.push(b);
    }

    for (const [, proj] of byProject) {
      const grp = document.createElement("optgroup");
      grp.label = proj.name;
      for (const b of proj.boms) {
        const opt = document.createElement("option");
        opt.value = b.bomId;
        opt.textContent = `${b.bomName} (${b.bomStatus})`;
        grp.appendChild(opt);
      }
      bomSelect.appendChild(grp);
    }
  } catch {
    bomSelect.innerHTML = "<option value=''>Erreur — connecté à AutoBOM ?</option>";
  }
}

// ── Init
async function init() {
  const base = await getBase();
  inputBase.value = base;

  const connected = await isConnected(base);
  if (!connected) {
    hideMainViews();
    show(viewLogin);
    return;
  }

  chrome.storage.local.get("autobom_pending", async (res) => {
    const raw = res.autobom_pending as string | undefined;
    if (!raw) {
      hideMainViews();
      show(viewEmpty);
      return;
    }

    let pending: Pending;
    try { pending = JSON.parse(raw) as Pending; } catch { hideMainViews(); show(viewEmpty); return; }

    const p = pending.payload;
    capName.textContent = p.designation;
    capSupplier.textContent = p.supplierName;
    capRef.textContent = p.supplierRef ? `Réf: ${p.supplierRef}` : "";
    capPrice.textContent = p.unitPriceHT ? `${p.unitPriceHT.toFixed(2)} € HT` : "";

    hideMainViews();
    show(viewCapture);

    await loadBoms(base);

    // Pre-select remembered BOM
    if (pending.bomId) bomSelect.value = pending.bomId;

    // Send
    btnSend.addEventListener("click", async () => {
      const bomId = bomSelect.value;
      if (!bomId) { setStatus("Sélectionne une BOM", "err"); return; }
      btnSend.disabled = true;
      btnSend.textContent = "Envoi…";

      // Remember last selected BOM
      chrome.storage.local.set({ autobom_pending: JSON.stringify({ payload: p, bomId }) });

      chrome.runtime.sendMessage({ type: "AUTOBOM_SEND", payload: p, bomId }, (res) => {
        if (res?.ok) {
          setStatus("✓ Ligne ajoutée à la BOM !", "ok");
          btnSend.textContent = "Envoyé !";
          setTimeout(() => window.close(), 1200);
        } else {
          setStatus("Erreur lors de l'envoi. Vérifie la connexion AUTBOM.", "err");
          btnSend.disabled = false;
          btnSend.textContent = "Envoyer dans la BOM";
        }
      });
    });

    // Discard
    btnDiscard.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "AUTOBOM_CLEAR" });
      window.close();
    });
  });
}

// ── Check connection status
async function checkConnection(base: string) {
  try {
    const r = await fetch(`${base}/api/me/boms`, { credentials: "include" });
    if (r.ok) {
      connStatus.textContent = "✓ Connecté à AutoBOM";
      connStatus.style.color = "#16a34a";
    } else {
      connStatus.textContent = "✗ Non connecté (clique le bouton ci-dessous)";
      connStatus.style.color = "#dc2626";
    }
  } catch {
    connStatus.textContent = "✗ Serveur inaccessible";
    connStatus.style.color = "#dc2626";
  }
}

// ── Settings toggle
btnSettingsToggle.addEventListener("click", async (e) => {
  e.preventDefault();
  viewSettings.classList.toggle("hidden");
  if (!viewSettings.classList.contains("hidden")) {
    const base = await getBase();
    checkConnection(base);
  }
});

btnLogin.addEventListener("click", async () => {
  openLogin();
});

btnLoginMain.addEventListener("click", () => {
  openLogin();
});

btnRefreshSession.addEventListener("click", () => {
  window.location.reload();
});

btnSaveSettings.addEventListener("click", () => {
  const base = inputBase.value.trim().replace(/\/$/, "");
  chrome.storage.local.set({ autobom_base: base }, () => {
    btnSaveSettings.textContent = "Enregistré ✓";
    setTimeout(() => { btnSaveSettings.textContent = "Enregistrer l'URL"; }, 1500);
  });
});

init();
