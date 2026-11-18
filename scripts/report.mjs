// Accuracy report over test/words.tsv: how often the expected reading is
// found at all, how often it is ranked first, and how fast analysis is.
//   node scripts/report.mjs [--misses]
import { readFileSync } from 'node:fs';
import { createAnalyzer, segmentation } from '../src/index.js';
import { loadCases, matches } from '../test/cases.js';

const lex = JSON.parse(readFileSync(new URL('../data/lexicon.json', import.meta.url), 'utf8'));
const analyzer = createAnalyzer(lex);
const cases = loadCases();
const showMisses = process.argv.includes('--misses');

let found = 0, top1 = 0, readings = 0, ms = 0;
const misses = [];
for (const c of cases) {
  const t = performance.now();
  const rs = analyzer.analyze(c.word);
  ms += performance.now() - t;
  readings += rs.length;
  const idx = rs.findIndex((r) => matches(r, c));
  if (idx >= 0) found++;
  if (idx === 0) top1++;
  else if (rs.length) misses.push(`${c.word}: expected #${idx + 1}, top = ${rs[0].root.lemma}: ${segmentation(rs[0])} (${rs[0].suffixes.map((s) => s.id).join(' ')})`);
}
const pct = (n) => `${((100 * n) / cases.length).toFixed(1)}%`;
console.log(`words: ${cases.length}`);
console.log(`expected reading found: ${found} (${pct(found)})`);
console.log(`expected reading ranked first: ${top1} (${pct(top1)})`);
console.log(`average readings per word: ${(readings / cases.length).toFixed(2)}`);
console.log(`average time per word: ${(ms / cases.length).toFixed(2)} ms`);
if (showMisses) console.log('\nNot ranked first:\n' + misses.join('\n'));
