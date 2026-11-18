import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAnalyzer, segmentation } from '../src/index.js';
import { loadCases, matches } from './cases.js';

const lexicon = JSON.parse(readFileSync(new URL('../data/lexicon.json', import.meta.url), 'utf8'));
const analyzer = createAnalyzer(lexicon);

const cases = loadCases();

test('test list has at least 500 words', () => {
  assert.ok(cases.length >= 500, `only ${cases.length} cases`);
});

for (const c of cases) {
  const label = `${c.word} -> ${c.lemma} ${c.suffixes.map((s) => `${s.surface}:${s.id}`).join(' ') || '-'}`;
  test(`[${c.group}] ${label}`, () => {
    const readings = analyzer.analyze(c.word);
    const ok = readings.some((r) => matches(r, c));
    if (!ok) {
      const got = readings.slice(0, 5).map((r) => `${r.root.lemma}: ${segmentation(r)} (${r.suffixes.map((s) => s.id).join(' ')})`);
      assert.fail(`expected reading not found. Got:\n  ${got.join('\n  ') || '(no readings)'}`);
    }
  });
}

test('unknown words return no readings', () => {
  for (const w of ['xqzv', 'kkkkk', 'qwerty']) assert.deepEqual(analyzer.analyze(w), []);
});

test('words are matched case-insensitively with Turkish rules', () => {
  const r = analyzer.analyze('KİTAPLAR');
  assert.ok(r.some((x) => x.root.lemma === 'kitap'));
  const r2 = analyzer.analyze('IŞIKLAR');
  assert.ok(r2.some((x) => x.root.lemma === 'ışık'));
});

test('punctuation around a word is ignored', () => {
  assert.ok(analyzer.analyze('"evlerde,"').some((x) => x.root.lemma === 'ev'));
});
