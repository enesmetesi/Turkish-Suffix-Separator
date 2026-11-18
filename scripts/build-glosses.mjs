// Builds data/glosses.json: short English meanings for the roots in
// data/lexicon.json, taken from English Wiktionary's Turkish entries as
// extracted by wiktextract (https://kaikki.org/dictionary/Turkish/).
// Wiktionary text is available under CC BY-SA 4.0; see data/LICENSE-wiktionary.txt.
//
// Usage: node scripts/build-glosses.mjs <kaikki.org-dictionary-Turkish.jsonl>

import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/build-glosses.mjs <kaikki Turkish .jsonl>');
  process.exit(1);
}

const POS = {
  noun: 'N', adj: 'Adj', adv: 'Adv', verb: 'V', pron: 'Pron', num: 'Num',
  name: 'Prop', postp: 'Postp', conj: 'Conj', intj: 'Interj', det: 'Det', particle: 'Ques',
};
const SKIP_TAGS = new Set(['form-of', 'alt-of', 'obsolete', 'archaic', 'misspelling', 'abbreviation']);
const MAX_LEN = 48;

const trLower = (s) => s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase()
  .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');

// Roots we actually need (verbs are stored without -mek/-mak).
const lexicon = JSON.parse(readFileSync(new URL('../data/lexicon.json', import.meta.url), 'utf8'));
const needed = new Set(lexicon.entries.map((e) => e.split(' ')[0]));

function clean(g) {
  return g
    .replace(/\s*\([^)]*\)/g, '') // drop parentheticals
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shorten(g) {
  const parts = g.split(/;\s*/);
  // Dictionary-style definitions often end with the plain words:
  // "A building for a family to reside in; house, home, abode".
  if (/^(A|An|The) /.test(g) && parts.length > 1 && parts[parts.length - 1].length <= MAX_LEN) {
    return parts[parts.length - 1];
  }
  if (g.length <= MAX_LEN) return g;
  const first = parts[0];
  if (first.length <= MAX_LEN) return first;
  const last = parts[parts.length - 1];
  if (parts.length > 1 && last.length <= MAX_LEN) return last;
  const cut = first.slice(0, MAX_LEN);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}

/** One short line from the first usable senses: "place, location; the ground". */
function glossOf(senses) {
  const usable = [];
  for (const s of senses ?? []) {
    if ((s.tags ?? []).some((t) => SKIP_TAGS.has(t))) continue;
    const g = s.glosses?.[s.glosses.length - 1];
    if (!g) continue;
    if (/^The name of the .* letter/.test(g)) continue;
    const c = clean(g);
    if (c && !usable.includes(c)) usable.push(c);
    if (usable.length >= 3) break;
  }
  if (!usable.length) return null;
  let best = shorten(usable[0]);
  const second = usable.find((u) => u !== best && u.length <= 20);
  if (second && best.length + second.length + 2 <= MAX_LEN) best = `${best}; ${second}`;
  return best;
}

const out = new Map();
const rl = createInterface({ input: createReadStream(input), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line) continue;
  const e = JSON.parse(line);
  const pos = POS[e.pos];
  if (!pos || e.lang_code !== 'tr') continue;
  let lemma = trLower(e.word);
  if (pos === 'V') {
    if (!/(mek|mak)$/.test(lemma)) continue;
    lemma = lemma.slice(0, -3);
  }
  if (!needed.has(lemma)) continue;
  const g = glossOf(e.senses);
  if (!g) continue;
  const key = `${lemma} ${pos}`;
  if (!out.has(key)) out.set(key, g); // first etymology wins
}

const entries = [...out.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, g]) => `${k}\t${g}`);
writeFileSync(new URL('../data/glosses.json', import.meta.url), JSON.stringify({
  source: 'English Wiktionary (Turkish entries) via wiktextract / kaikki.org. CC BY-SA 4.0. Converted and shortened by scripts/build-glosses.mjs.',
  format: 'root pos<TAB>gloss',
  count: entries.length,
  entries,
}) + '\n');
console.log(`Wrote ${entries.length} glosses to data/glosses.json`);
