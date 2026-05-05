import esbuild from "esbuild";
import { cpSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { deflateSync } from "zlib";

const watch = process.argv.includes("--watch");
const outdir = "dist";

mkdirSync(outdir, { recursive: true });

// ── PNG icon generator (pure Node.js, zero deps) ─────────────────────────────

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

(function buildCrcTable() {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  globalThis._crcTable = t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = globalThis._crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([t, data]);
  return Buffer.concat([u32be(data.length), t, data, u32be(crc32(crcData))]);
}

function encodePNG(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // bit depth 8, color type RGBA
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter: None
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw.push(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
    }
  }
  return Buffer.concat([
    PNG_SIG,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(Buffer.from(raw))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(px, w, x, y, r, g, b, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= w || y < 0 || y >= w) return;
  const i = (y * w + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}

function drawLine(px, w, x0, y0, x1, y1, r, g, b, thick = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  const h = Math.floor(thick / 2);
  while (true) {
    for (let ty = -h; ty <= h; ty++)
      for (let tx = -h; tx <= h; tx++)
        setPixel(px, w, x + tx, y + ty, r, g, b);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx)  { err += dx; y += sy; }
  }
}

function fillRoundedRect(px, w, x0, y0, rw, rh, radius, r, g, b) {
  for (let py = y0; py < y0 + rh; py++) {
    for (let px2 = x0; px2 < x0 + rw; px2++) {
      const cx = Math.min(Math.max(px2, x0 + radius), x0 + rw - radius);
      const cy = Math.min(Math.max(py, y0 + radius), y0 + rh - radius);
      if (Math.hypot(px2 - cx, py - cy) <= radius)
        setPixel(px, w, px2, py, r, g, b);
    }
  }
}

function makeIcon(size) {
  const px = new Uint8Array(size * size * 4); // fully transparent
  const pad = Math.round(size * 0.11);
  const radius = Math.round(size * 0.18);

  // Background (#07071a)
  fillRoundedRect(px, size, 0, 0, size, size, radius, 7, 7, 26);

  // Triangle vertices
  const tx = size / 2, ty = pad + 1;
  const blx = pad,          bly = size - pad - 1;
  const brx = size - pad,   bry = size - pad - 1;

  // Horizontal bar position
  const barY  = Math.round(bly - (bly - ty) * 0.28);
  const barLx = Math.round(blx + (brx - blx) * 0.34);
  const barRx = Math.round(brx - (brx - blx) * 0.34);

  const thick = Math.max(1, Math.round(size * 0.024));
  const thin  = Math.max(1, Math.round(size * 0.017));

  // Triangle sides (#6366f1 = 99,102,241)
  drawLine(px, size, tx, ty, blx, bly, 99, 102, 241, thick);
  drawLine(px, size, tx, ty, brx, bry, 99, 102, 241, thick);
  drawLine(px, size, blx, bly, brx, bry, 99, 102, 241, thick);

  // Horizontal bar (#6366f1)
  drawLine(px, size, barLx, barY, barRx, barY, 99, 102, 241, thick);

  // Inner accent lines from apex to top of bar (#a5b4fc = 165,180,252)
  const midLx = (tx + blx) / 2, midLy = (ty + bly) / 2;
  const midRx = (tx + brx) / 2, midRy = (ty + bry) / 2;
  drawLine(px, size, tx, ty + thin, midLx, midLy, 165, 180, 252, thin);
  drawLine(px, size, tx, ty + thin, midRx, midRy, 165, 180, 252, thin);

  return px;
}

mkdirSync(`${outdir}/icons`, { recursive: true });
for (const size of [16, 48, 128]) {
  writeFileSync(`${outdir}/icons/icon${size}.png`, encodePNG(makeIcon(size), size));
  console.log(`[icons] icon${size}.png`);
}

// ── Copy static assets ────────────────────────────────────────────────────────
cpSync("manifest.json", `${outdir}/manifest.json`);
cpSync("src/popup/index.html", `${outdir}/popup.html`);
try { cpSync("src/popup/popup.css", `${outdir}/popup.css`); } catch { /* optional */ }

const sharedConfig = {
  bundle: true,
  format: /** @type {const} */ ("esm"),
  target: "chrome120",
  logLevel: "info",
};

const ctx = await esbuild.context({
  ...sharedConfig,
  entryPoints: {
    "background": "src/background/index.ts",
    "content/tolery": "src/content/tolery.ts",
    "content/amazon": "src/content/amazon.ts",
    "content/misumi": "src/content/misumi.ts",
    "content/rs": "src/content/rs.ts",
    "content/generic": "src/content/generic.ts",
    "popup": "src/popup/popup.ts",
  },
  outdir,
  splitting: false,
});

if (watch) {
  await ctx.watch();
  console.log("[AUTBOM ext] watching...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("[AUTBOM ext] build done →", resolve(outdir));
}
