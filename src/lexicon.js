// Root lexicon: turns the compact entries of data/lexicon.json into a lookup
// table from every surface form a root can take (kitap, kitab; ağız, ağz;
// oku, ok- before -Iyor) to the root entry and the condition on what follows.

import { dropLastVowel, frontOf, lastVowel, voiceFinal } from './phonology.js';

/**
 * Condition a root or suffix surface puts on the next suffix:
 *   null       anything (or end of word)
 *   'vowel'    next suffix must start with a vowel (kitab-ı)
 *   'noVowel'  next suffix must not start with a vowel, or the word ends (kitap, kitap-lar)
 *   'prog'     next suffix must be -Iyor (başl-ıyor)
 *   'y'        next suffix must start with y (di-yecek)
 *   'suffix'   some suffix must follow (on-u, but bare "on" is not the pronoun o)
 */

// Extra entries that the Zemberek lexicon lacks or that need special stems.
const EXTRA_ENTRIES = ['mu Ques #60', 'mü Ques #70'];

// Pronoun stems with irregular surface forms.
const PRONOUN_STEMS = {
  o: [{ surface: 'on' }],
  bu: [{ surface: 'bun' }],
  şu: [{ surface: 'şun' }],
};
// Whole-word irregulars: surface -> [lemma, pos, [[suffixSurface, id], ...]]
export const IRREGULAR_WORDS = {
  bana: ['ben', 'Pron', [['a', 'Dat']], 'ban'],
  sana: ['sen', 'Pron', [['a', 'Dat']], 'san'],
  benim: ['ben', 'Pron', [['im', 'Gen']]],
  bizim: ['biz', 'Pron', [['im', 'Gen']]],
  benimle: ['ben', 'Pron', [['im', 'Gen'], ['le', 'Ins']]],
  bizimle: ['biz', 'Pron', [['im', 'Gen'], ['le', 'Ins']]],
  benimki: ['ben', 'Pron', [['im', 'Gen'], ['ki', 'Rel']]],
  bizimki: ['biz', 'Pron', [['im', 'Gen'], ['ki', 'Rel']]],
  onunla: ['o', 'Pron', [['un', 'Gen'], ['la', 'Ins']], 'on'],
  bunun: ['bu', 'Pron', [['un', 'Gen']], 'bun'],
};

export function parseEntry(line) {
  const parts = line.split(' ');
  const entry = { lemma: parts[0], pos: parts[1], flags: new Set(), rank: Infinity };
  for (const p of parts.slice(2)) {
    if (p.startsWith('#')) entry.rank = Number(p.slice(1));
    else for (const f of p.split(',')) entry.flags.add(f);
  }
  if (entry.flags.has('Prop')) entry.pos = entry.pos === 'V' ? 'V' : 'Prop';
  return entry;
}

/** All surface forms of one root, each with its condition on the next suffix. */
export function rootVariants(entry) {
  const { lemma, pos, flags } = entry;
  const lv = lastVowel(lemma);
  // Inverse harmony (saat-ler, gol-ü): the first suffix harmonizes with a front vowel.
  const harmony = flags.has('InverseHarmony') && lv ? frontOf(lv) : undefined;
  const changesBeforeVowel = flags.has('Voicing') || flags.has('LastVowelDrop') || flags.has('Doubling');
  const out = [{ surface: lemma, cond: changesBeforeVowel ? 'noVowel' : null, harmony }];

  if (flags.has('Voicing')) {
    const v = voiceFinal(lemma);
    if (v) out.push({ surface: v, cond: 'vowel', harmony });
  }
  if (flags.has('LastVowelDrop')) {
    const d = dropLastVowel(lemma);
    // Harmony still follows the dropped vowel: ağız -> ağz-ı, oğul -> oğl-u.
    if (d) out.push({ surface: d, cond: 'vowel', harmony: harmony ?? lv });
  }
  if (flags.has('Doubling')) {
    out.push({ surface: lemma + lemma[lemma.length - 1], cond: 'vowel', harmony });
  }
  if (pos === 'V' && flags.has('ProgressiveVowelDrop')) {
    const d = lemma.slice(0, -1);
    // de -> d-iyor: no vowel left, so harmony comes from the dropped one.
    out.push({ surface: d, cond: 'prog', harmony: lastVowel(d) ? undefined : lv });
  }
  if (pos === 'V' && (lemma === 'de' || lemma === 'ye')) {
    out.push({ surface: lemma[0] + 'i', cond: 'y' }); // di-yecek, yi-yen
  }
  if (pos === 'Pron' && PRONOUN_STEMS[lemma]) {
    for (const s of PRONOUN_STEMS[lemma]) out.push({ surface: s.surface, cond: 'suffix' });
  }
  if (lemma === 'su' && pos === 'N') out.push({ surface: 'suy', cond: 'vowel' });
  return out;
}

export class Lexicon {
  /**
   * @param {string[]} entries lines in data/lexicon.json format
   * @param {string[]} [glossEntries] lines in data/glosses.json format ("root pos\tgloss")
   */
  constructor(entries, glossEntries = []) {
    this.glosses = new Map();
    for (const line of glossEntries) {
      const tab = line.indexOf('\t');
      this.glosses.set(line.slice(0, tab), line.slice(tab + 1));
    }
    this.bySurface = new Map();
    this.byLemma = new Map();
    this.maxLen = 0;
    for (const line of [...entries, ...EXTRA_ENTRIES]) this.add(parseEntry(line));
  }

  add(entry) {
    if (!this.byLemma.has(entry.lemma)) this.byLemma.set(entry.lemma, []);
    this.byLemma.get(entry.lemma).push(entry);
    for (const v of rootVariants(entry)) {
      if (!this.bySurface.has(v.surface)) this.bySurface.set(v.surface, []);
      this.bySurface.get(v.surface).push({ entry, ...v });
      this.maxLen = Math.max(this.maxLen, v.surface.length);
    }
  }

  /** Root candidates whose surface is exactly `surface`. */
  lookup(surface) {
    return this.bySurface.get(surface) ?? [];
  }

  /** Entries for a lemma (used to look up flags of a proper noun before an apostrophe). */
  entries(lemma) {
    return this.byLemma.get(lemma) ?? [];
  }

  /**
   * Short English meaning for a root. Falls back to another part of speech of
   * the same kind (a noun's meaning for an adjective reading), and uses a
   * proper-noun meaning ("a female given name") only for proper nouns.
   */
  gloss(lemma, pos) {
    const exact = this.glosses.get(`${lemma} ${pos}`);
    if (exact) return exact;
    const order = pos === 'V' ? ['V'] : ['N', 'Adj', 'Pron', 'Num', 'Adv', 'Postp', 'Conj', 'Det', 'Interj', 'Ques'];
    if (pos === 'Prop') order.push('Prop');
    for (const p of order) {
      const g = this.glosses.get(`${lemma} ${p}`);
      if (g) return g;
    }
    return null;
  }

  static fromJSON(json, glossesJson = null) {
    return new Lexicon(json.entries, glossesJson?.entries ?? []);
  }
}
