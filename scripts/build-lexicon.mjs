// Builds data/lexicon.json from the Zemberek lexicon files (Apache 2.0).
//
// Usage: node scripts/build-lexicon.mjs <path-to-zemberek-nlp>
//
// Reads morphology/src/main/resources/tr/{master-dictionary,non-tdk,proper}.dict
// and first-10K (word frequency list), and writes one compact line per root:
//   "<root> <pos> [flag,flag...] [#rank]"
// Verbs are stored without -mek/-mak. Default attributes are inferred the way
// Zemberek's TurkishDictionaryLoader.inferMorphemicAttributes does, so the
// runtime analyzer only needs to read flags.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const zemberekRoot = process.argv[2];
if (!zemberekRoot) {
  console.error('Usage: node scripts/build-lexicon.mjs <path-to-zemberek-nlp>');
  process.exit(1);
}
const resDir = join(zemberekRoot, 'morphology/src/main/resources/tr');

const VOWELS = 'aeıioöuüâîû';
const STOPS = 'çkpt';
const vowelCount = (w) => [...w].filter((c) => VOWELS.includes(c)).length;

// Zemberek primary POS -> our short code.
const POS_MAP = {
  Noun: 'N', Adj: 'Adj', Adv: 'Adv', Conj: 'Conj', Interj: 'Interj',
  Postp: 'Postp', Det: 'Det', Pron: 'Pron', Num: 'Num', Ques: 'Ques',
  Verb: 'V', Dup: null, Punc: null,
};
// Attributes the analyzer understands. Others are dropped.
const KEEP_ATTRS = new Set([
  'Voicing', 'NoVoicing', 'InverseHarmony', 'LastVowelDrop', 'Doubling',
  'Aorist_A', 'Aorist_I', 'ProgressiveVowelDrop', 'Prop',
]);

function trLower(s) {
  return s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
}

// Normalize circumflex letters to plain ones; keep a "front" hint for â/û after
// k, g, l (kâğıt, rüzgâr) via InverseHarmony when the last vowel is one of them.
function normalize(word, attrs) {
  const lastV = [...word].reverse().find((c) => VOWELS.includes(c));
  if (lastV === 'â' || lastV === 'û') attrs.add('InverseHarmony');
  return word.replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
}

function parseLine(line) {
  const t = line.trim();
  if (!t || t.startsWith('#')) return null;
  const m = t.match(/^(.+?)\s*(?:\[(.*)\])?\s*$/);
  if (!m) return null;
  const word = m[1].trim();
  const meta = {};
  if (m[2]) {
    for (const part of m[2].split(';')) {
      const i = part.indexOf(':');
      if (i < 0) continue;
      meta[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
  }
  return { word, meta };
}

function inferAttrs(root, pos, attrs, secondary) {
  const last = root[root.length - 1];
  const lastIsVowel = VOWELS.includes(last);
  const vc = vowelCount(root);
  if (pos === 'V') {
    if (lastIsVowel) attrs.add('ProgressiveVowelDrop');
    if (vc > 1 && !attrs.has('Aorist_A')) attrs.add('Aorist_I');
    if (vc === 1 && !attrs.has('Aorist_I')) attrs.add('Aorist_A');
    // An explicit Aorist_A wins over the polysyllabic default.
    if (attrs.has('Aorist_A')) attrs.delete('Aorist_I');
  } else if (pos === 'N' || pos === 'Adj') {
    if (vc > 1 && STOPS.includes(last) && secondary !== 'Prop'
        && !attrs.has('NoVoicing') && !attrs.has('InverseHarmony')) {
      attrs.add('Voicing');
    }
    if (root.endsWith('nk') || root.endsWith('og')) {
      if (!attrs.has('NoVoicing') && secondary !== 'Prop') attrs.add('Voicing');
    } else if (vc < 2 && !attrs.has('Voicing')) {
      attrs.add('NoVoicing');
    }
  }
}

function loadFreq() {
  const ranks = new Map();
  const lines = readFileSync(join(resDir, 'first-10K'), 'utf8').split('\n');
  lines.forEach((w, i) => {
    const k = trLower(w.trim());
    if (k && !ranks.has(k)) ranks.set(k, i + 1);
  });
  return ranks;
}

const freq = loadFreq();
const seenRoots = new Set();
const out = new Map(); // key "root pos flags" -> entry

function addFile(file, { proper = false } = {}) {
  const lines = readFileSync(join(resDir, file), 'utf8').split('\n');
  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    let { word, meta } = parsed;
    if (/\s/.test(word)) continue; // multi-word items are out of v1 scope
    const [primaryRaw, secondaryRaw] = (meta.P || '').split(',').map((s) => s.trim());
    let pos;
    if (primaryRaw) {
      pos = POS_MAP[primaryRaw];
      if (pos === undefined) pos = 'N';
      if (pos === null) continue;
    } else if (/(mek|mak)$/.test(word) && !proper) {
      pos = 'V';
    } else {
      pos = 'N';
    }
    const attrs = new Set();
    for (const a of (meta.A || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      if (KEEP_ATTRS.has(a)) attrs.add(a);
    }
    let secondary = secondaryRaw || '';
    if (proper) { secondary = 'Prop'; attrs.add('Prop'); }
    let root = trLower(word);
    if (proper && seenRoots.has(root)) continue; // "Al", "Hak": the common word is enough
    if (!/^[a-zçğıöşüâîû]+$/.test(root)) continue;
    if (pos === 'V') {
      // "değil [P:Verb]" and similar: no -mek/-mak, behaves like a nominal with copula.
      if (/(mek|mak)$/.test(root)) root = root.slice(0, -3);
      else pos = 'N';
    }
    if (!root) continue;
    root = normalize(root, attrs);
    inferAttrs(root, pos, attrs, secondary);
    // Rank: frequency of the lemma as a word form (verbs: the -mek form, or the bare stem).
    const rank = pos === 'V'
      ? Math.min(freq.get(trLower(word)) ?? Infinity, freq.get(root) ?? Infinity)
      : freq.get(root) ?? Infinity;
    const flags = [...attrs].sort();
    const key = `${root} ${pos} ${flags.join(',')}`;
    const prev = out.get(key);
    if (!prev || rank < prev.rank) out.set(key, { root, pos, flags, rank });
    if (!proper) seenRoots.add(root);
  }
}

addFile('master-dictionary.dict');
addFile('non-tdk.dict');
addFile('proper.dict', { proper: true });

const entries = [...out.values()]
  .sort((a, b) => (a.root < b.root ? -1 : a.root > b.root ? 1 : a.pos < b.pos ? -1 : 1))
  .map((e) => {
    let s = `${e.root} ${e.pos}`;
    if (e.flags.length) s += ` ${e.flags.join(',')}`;
    if (Number.isFinite(e.rank)) s += ` #${e.rank}`;
    return s;
  });

const json = {
  source: 'Zemberek NLP lexicon (https://github.com/ahmetaa/zemberek-nlp), Apache License 2.0. Converted by scripts/build-lexicon.mjs.',
  format: 'root pos [flags] [#frequencyRank]',
  count: entries.length,
  entries,
};
writeFileSync(new URL('../data/lexicon.json', import.meta.url), JSON.stringify(json) + '\n');
console.log(`Wrote ${entries.length} entries to data/lexicon.json`);
