import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAnalyzer } from '../src/index.js';
import { buildCard, rootNote } from '../src/card.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const analyzer = createAnalyzer(load('lexicon.json'), load('glosses.json'));
const card = (w) => buildCard(w, analyzer.analyze(w));

test('card for gidemeyeceklermiş', () => {
  const c = card('gidemeyeceklermiş');
  assert.equal(c.recognized, true);
  assert.deepEqual(c.segments.map((s) => s.text), ['gid', 'eme', 'yecek', 'ler', 'miş']);
  assert.equal(c.rows[0].part, 'git-');
  assert.match(c.rows[0].meaning, /to go/);
  assert.equal(c.rows[0].note, 't → d before a vowel: gid-');
  assert.deepEqual(c.rows.slice(1).map((r) => r.meaning), ['cannot', 'will', 'they', 'reportedly / apparently']);
});

test('grammar terms in both languages by default, English or Turkish on request', () => {
  const r = analyzer.analyze('evde');
  const term = (opts) => buildCard('evde', r, opts).rows[1].term;
  assert.equal(term(), 'locative case - bulunma hâli');
  assert.equal(term({ terms: 'en' }), 'locative case');
  assert.equal(term({ terms: 'tr' }), 'bulunma hâli');
});

test('every suffix has an English grammar term', async () => {
  const { SUFFIXES } = await import('../src/suffixes.js');
  for (const [id, s] of Object.entries(SUFFIXES)) assert.ok(s.term, id);
});

test('unknown word', () => {
  assert.deepEqual(card('xqzvt'), { word: 'xqzvt', recognized: false });
});

test('ambiguous word lists the other readings', () => {
  const c = card('kitabı');
  assert.ok(c.moreCount >= 1);
  assert.equal(c.others.length, Math.min(3, c.moreCount));
});

test('root notes', () => {
  assert.equal(rootNote({ lemma: 'ağız', surface: 'ağz', pos: 'N' }, { id: 'P3sg' }), 'the last vowel drops before a vowel: ağz-');
  assert.equal(rootNote({ lemma: 'hak', surface: 'hakk', pos: 'N' }, { id: 'P3sg' }), 'k doubles before a vowel: hakk-');
  assert.equal(rootNote({ lemma: 'oku', surface: 'ok', pos: 'V' }, { id: 'Prog' }), 'final u merges into -yor');
  assert.equal(rootNote({ lemma: 'kitap', surface: 'kitap', pos: 'N' }, null), null);
});
