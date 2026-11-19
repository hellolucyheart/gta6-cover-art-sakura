// Sakura Vice — grader entrypoint (node 22, erasable TypeScript).
// Copies app/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with the kit's dossier builder.
// The output is deterministic: same input files, same dossier bytes.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(import.meta.dirname);
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : join(repoRoot, 'out');

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error(`missing ${name}/ in repository`);
  cpSync(src, dst, { recursive: true });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
