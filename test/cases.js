// Reads test/words.tsv.
import { readFileSync } from 'node:fs';

export function loadCases() {
  const text = readFileSync(new URL('./words.tsv', import.meta.url), 'utf8');
  const cases = [];
  let group = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('# ---')) group = line.replace(/^# -+\s*|\s*-+$/g, '');
    if (!line.trim() || line.startsWith('#')) continue;
    const [word, lemma, sfx] = line.split('\t');
    const suffixes = sfx === '-' ? [] : sfx.split(' ').map((p) => {
      const i = p.lastIndexOf(':');
      return { surface: p.slice(0, i), id: p.slice(i + 1) };
    });
    cases.push({ word, lemma, suffixes, group });
  }
  return cases;
}

export function matches(reading, expected) {
  if (reading.root.lemma !== expected.lemma) return false;
  const got = reading.suffixes.filter((s) => s.surface);
  if (got.length !== expected.suffixes.length) return false;
  return got.every((s, i) => s.surface === expected.suffixes[i].surface && s.id === expected.suffixes[i].id);
}

