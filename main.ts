/**
 * Sakura Vice — GTA 6 Cover Art Studio, program entrypoint.
 *
 * The grader runs `node main.ts` with the repository read-only and a
 * writable output directory in MAKEFUN_OUTPUT_DIR. This program copies
 * app/ and screenshots/ into that directory and writes dossier.json
 * with buildDossier from the kit's vendored library, byte for byte
 * the dossier the scorer expects. Same inputs, same bytes, every run.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || resolve("out");

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000
};

function main(): void {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
  cpSync(join(ROOT, "app"), join(OUT_DIR, "app"), { recursive: true });
  cpSync(join(ROOT, "screenshots"), join(OUT_DIR, "screenshots"), { recursive: true });
  const dossier = buildDossier(OUT_DIR, CAPS);
  writeFileSync(join(OUT_DIR, "dossier.json"), dossier);
  const check = JSON.parse(readFileSync(join(OUT_DIR, "dossier.json"), "utf8")) as {
    schema?: string;
  };
  if (check.schema !== "makefun/dossier/v1") {
    throw new Error("dossier.json schema mismatch");
  }
  console.log(`wrote ${join(OUT_DIR, "dossier.json")} (${dossier.length} bytes)`);
}

main();
