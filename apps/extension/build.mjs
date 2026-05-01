import esbuild from "esbuild";
import { cpSync, mkdirSync } from "fs";
import { resolve } from "path";

const watch = process.argv.includes("--watch");
const outdir = "dist";

mkdirSync(outdir, { recursive: true });

// Copy static assets
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
