// Vice City Cover Studio — the entrypoint make.fun runs (Node 22, stdlib only).
//
// It gathers the finished entry — the app/ folder and the screenshots/ folder
// that sit beside this file — into the output directory, then asks the
// vendored make.fun library to write the dossier that describes them.
// The grader runs this file twice and expects identical bytes both times.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function handIn(folder: string): void {
  const source = join(repoRoot, folder);
  const target = join(outDir, folder);
  if (!existsSync(source)) {
    throw new Error(`hand-in: ${folder}/ is missing from the repository`);
  }
  cpSync(source, target, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
handIn("app");
handIn("screenshots");

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log(`wrote ${join(outDir, "dossier.json")} (${dossier.length} bytes)`);
