import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realize, harmonyI, harmonyA, voiceFinal, dropLastVowel, trLower } from '../src/phonology.js';

test('two-way and four-way vowel harmony', () => {
  assert.equal(harmonyA('a'), 'a');
  assert.equal(harmonyA('ü'), 'e');
  assert.deepEqual(['a', 'e', 'o', 'ö', 'ı', 'i', 'u', 'ü'].map(harmonyI), ['ı', 'i', 'u', 'ü', 'ı', 'i', 'u', 'ü']);
});

test('suffix templates', () => {
  assert.equal(realize('lAr', 'kitap'), 'lar');
  assert.equal(realize('DA', 'kitap'), 'ta');
  assert.equal(realize('DA', 'ev'), 'de');
  assert.equal(realize('(y)I', 'araba'), 'yı');
  assert.equal(realize('(y)I', 'ev'), 'i');
  assert.equal(realize('(s)I', 'araba'), 'sı');
  assert.equal(realize('(I)m', 'göz'), 'üm');
  assert.equal(realize('(I)m', 'anne'), 'm');
  assert.equal(realize('(n)In', 'kedi'), 'nin');
  assert.equal(realize('CI', 'iş'), 'çi');
  assert.equal(realize('CI', 'yol'), 'cu');
  assert.equal(realize('(y)AcAk', 'oku'), 'yacak');
  assert.equal(realize('(y)AcAk', 'gel'), 'ecek');
  assert.equal(realize('lAr', 'saat', 'e'), 'ler'); // inverse harmony
});

test('consonant and vowel changes', () => {
  assert.equal(voiceFinal('kitap'), 'kitab');
  assert.equal(voiceFinal('ağaç'), 'ağac');
  assert.equal(voiceFinal('git'), 'gid');
  assert.equal(voiceFinal('çocuk'), 'çocuğ');
  assert.equal(voiceFinal('renk'), 'reng');
  assert.equal(dropLastVowel('ağız'), 'ağz');
  assert.equal(trLower('IŞIK İSTANBUL'), 'ışık istanbul');
});
