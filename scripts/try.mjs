// Quick manual check: node scripts/try.mjs gidemeyeceklermiş kitabı
import { readFileSync } from 'node:fs';
import { createAnalyzer, segmentation } from '../src/index.js';

const lex = JSON.parse(readFileSync(new URL('../data/lexicon.json', import.meta.url), 'utf8'));
const t0 = performance.now();
const analyzer = createAnalyzer(lex);
console.log(`lexicon loaded in ${(performance.now() - t0).toFixed(0)} ms`);
for (const w of process.argv.slice(2)) {
  const t = performance.now();
  const rs = analyzer.analyze(w);
  const ms = (performance.now() - t).toFixed(2);
  console.log(`\n${w}  (${rs.length} readings, ${ms} ms)`);
  for (const r of rs.slice(0, 6)) {
    console.log(`  ${r.score.toFixed(2)}  ${r.root.lemma}[${r.root.pos}]  ${segmentation(r)}  ${r.suffixes.map((s) => s.id).join(' ')}`);
  }
}
