// Turkish sound rules: vowel harmony, consonant assimilation, buffer letters
// and the voicing of a final stop before a vowel.

export const VOWELS = 'aeıioöuü';
const BACK_VOWELS = 'aıou';
const ROUNDED_VOWELS = 'oöuü';
// Voiceless consonants ("fıstıkçı şahap"): after these, D -> t, C -> ç, G -> k.
const VOICELESS = 'çfhkpsşt';

export const isVowel = (c) => c !== undefined && VOWELS.includes(c);
export const isVoiceless = (c) => c !== undefined && VOICELESS.includes(c);

export function lastVowel(s) {
  for (let i = s.length - 1; i >= 0; i--) if (VOWELS.includes(s[i])) return s[i];
  return null;
}

export const startsWithVowel = (s) => s.length > 0 && isVowel(s[0]);
export const endsWithVowel = (s) => s.length > 0 && isVowel(s[s.length - 1]);

// Turkish-aware lowercase (I -> ı, İ -> i). Also folds circumflex letters.
export function trLower(s) {
  return s
    .replace(/I/g, 'ı')
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/i̇/g, 'i') // "İ".toLowerCase() in some engines
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');
}

/** Two-way harmony: A -> a | e. */
export function harmonyA(v) {
  return v && BACK_VOWELS.includes(v) ? 'a' : 'e';
}

/** Four-way harmony: I -> ı | i | u | ü. */
export function harmonyI(v) {
  if (!v) return 'i';
  const back = BACK_VOWELS.includes(v);
  const round = ROUNDED_VOWELS.includes(v);
  if (back) return round ? 'u' : 'ı';
  return round ? 'ü' : 'i';
}

/** Front counterpart of a vowel, used for roots with inverse harmony (saat, gol). */
export function frontOf(v) {
  return { a: 'e', ı: 'i', o: 'ö', u: 'ü' }[v] ?? v;
}

/** Voicing of a final stop before a vowel: kitap -> kitab, renk -> reng. */
export function voiceFinal(s) {
  const last = s[s.length - 1];
  if (last === 'k' && s[s.length - 2] === 'n') return s.slice(0, -1) + 'g';
  const map = { p: 'b', ç: 'c', t: 'd', k: 'ğ', g: 'ğ' };
  return map[last] ? s.slice(0, -1) + map[last] : null;
}

/** Drops the last vowel of a root: ağız -> ağz, burun -> burn. */
export function dropLastVowel(s) {
  for (let i = s.length - 1; i >= 0; i--) {
    if (VOWELS.includes(s[i])) return s.slice(0, i) + s.slice(i + 1);
  }
  return null;
}

/**
 * Realizes an abstract suffix template after a given surface.
 *
 * Template letters:
 *   A        a/e by two-way harmony
 *   I        ı/i/u/ü by four-way harmony
 *   D        d, or t after a voiceless consonant
 *   C        c, or ç after a voiceless consonant
 *   G        g, or k after a voiceless consonant
 *   (y) (n) (s) (ş)  buffer letter, kept only after a vowel
 *   (I)      linking vowel, kept only after a consonant
 *   other    written as is
 *
 * @param {string} template
 * @param {string} prev       surface written so far (stem plus earlier suffixes)
 * @param {string|null} harmonyVowel  vowel that drives harmony (defaults to the last vowel of prev)
 */
export function realize(template, prev, harmonyVowel = undefined) {
  let out = '';
  let v = harmonyVowel === undefined ? lastVowel(prev) : harmonyVowel;
  const lastChar = () => (out.length ? out[out.length - 1] : prev[prev.length - 1]);
  for (let i = 0; i < template.length; i++) {
    const c = template[i];
    if (c === '(') {
      const close = template.indexOf(')', i);
      const inner = template.slice(i + 1, close);
      i = close;
      const afterVowel = isVowel(lastChar());
      if (inner === 'I') {
        if (!afterVowel) {
          const h = harmonyI(v);
          out += h;
          v = h;
        }
      } else if (afterVowel) {
        out += inner;
      }
      continue;
    }
    let ch;
    switch (c) {
      case 'A': ch = harmonyA(v); break;
      case 'I': ch = harmonyI(v); break;
      case 'D': ch = isVoiceless(lastChar()) ? 't' : 'd'; break;
      case 'C': ch = isVoiceless(lastChar()) ? 'ç' : 'c'; break;
      case 'G': ch = isVoiceless(lastChar()) ? 'k' : 'g'; break;
      default: ch = c;
    }
    out += ch;
    if (isVowel(ch)) v = ch;
  }
  return out;
}
