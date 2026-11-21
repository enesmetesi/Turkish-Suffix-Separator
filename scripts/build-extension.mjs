// Assembles the Chrome extension in dist/extension and zips it for the
// Chrome Web Store as dist/turkish-suffix-separator-<version>.zip.
//   node scripts/build-extension.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'dist/extension');
rmSync(join(root, 'dist'), { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(join(root, 'extension'), out, { recursive: true });
mkdirSync(join(out, 'src'));
for (const f of readdirSync(join(root, 'src'))) {
  if (f.endsWith('.js')) cpSync(join(root, 'src', f), join(out, 'src', f));
}
mkdirSync(join(out, 'data'));
for (const f of ['lexicon.json', 'glosses.json', 'LICENSE-zemberek.txt', 'LICENSE-wiktionary.txt']) {
  cpSync(join(root, 'data', f), join(out, 'data', f));
}

const { version } = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
const zipName = `turkish-suffix-separator-${version}.zip`;
try {
  execFileSync('zip', ['-qr', join('..', zipName), '.'], { cwd: out });
  console.log(`Built dist/extension and dist/${zipName}`);
} catch {
  console.log('Built dist/extension (zip not found: compress the folder by hand for the Web Store).');
}
