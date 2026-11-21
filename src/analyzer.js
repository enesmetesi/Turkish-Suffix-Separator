// Rule-based Turkish word analyzer.
//
// For every prefix of the word that is a known root surface, it walks the
// suffix state machine left to right. At each step it realizes the next
// suffix's template for the surface written so far (vowel harmony, buffer
// letters, d/t assimilation) and keeps the path only if the word continues
// with exactly that text. This is the "regenerate and compare" check from the
// v1 scope: a reading is only returned if the rules can produce the word.

import {
  endsWithVowel, frontOf, lastVowel, realize, startsWithVowel, trLower, voiceFinal,
} from './phonology.js';
import { SUFFIXES, DERIVATIONAL } from './suffixes.js';
import { STATES, startState, VERB_STATES } from './morphotactics.js';
import { IRREGULAR_WORDS } from './lexicon.js';

const MAX_DERIVATIONS = 3;
const MAX_RESULTS = 200;
const APOSTROPHES = /['’‘`]/;

function satisfies(cond, nextSurface, suffixId) {
  switch (cond) {
    case null: case undefined: return true;
    case 'vowel': return startsWithVowel(nextSurface);
    case 'noVowel': return !startsWithVowel(nextSurface);
    case 'prog': return suffixId === 'Prog';
    case 'y': return nextSurface.startsWith('y');
    case 'suffix': return true;
    default: return false;
  }
}

function endAllowed(cond) {
  return cond === null || cond === undefined || cond === 'noVowel';
}

/**
 * Surface candidates for one transition after `prev`.
 * Returns [{ surface, cond, harmony }] where cond/harmony apply to what follows.
 */
function realizeTransition(tr, prev, harmony, ctx) {
  const sfx = SUFFIXES[tr.s];
  let template = tr.form ?? sfx.form;

  switch (tr.special) {
    case 'aor':
      // Vowel stem: oku-r. Monosyllabic consonant stem: yap-ar (unless listed
      // as -Ir: gel-ir, al-ır). Longer or derived stems: konuş-ur, yap-ıl-ır.
      if (endsWithVowel(prev)) template = 'r';
      else template = ctx.aoristA ? 'Ar' : 'Ir';
      break;
    case 'pass':
      // oku-n, bil-in, yap-ıl.
      if (endsWithVowel(prev)) template = 'n';
      else if (prev.endsWith('l')) template = 'In';
      else template = 'Il';
      break;
    case 'caus': {
      // oku-t, otur-t, kısal-t; otherwise yap-tır, öl-dür.
      const polysyllabic = (prev.match(/[aeıioöuü]/g) ?? []).length > 1;
      if (endsWithVowel(prev) || (polysyllabic && /[lr]$/.test(prev))) template = 't';
      else template = 'DIr';
      break;
    }
    case 'recip':
      // anla-ş, gör-üş.
      template = endsWithVowel(prev) ? 'ş' : 'Iş';
      break;
    case 'prog':
      if (endsWithVowel(prev)) return []; // the vowel-dropped stem handles this
      break;
    case 'consonantStem':
      if (endsWithVowel(prev)) return [];
      break;
    default:
  }

  const surface = realize(template, prev, harmony);
  const keepHarmony = lastVowel(surface) ? undefined : harmony;
  const out = [];
  const leadsToVerb = VERB_STATES.has(tr.to);

  if (sfx.voices && surface.endsWith('k')) {
    out.push({ surface, cond: 'noVowel', harmony: keepHarmony });
    out.push({ surface: voiceFinal(surface), cond: 'vowel', harmony: keepHarmony });
  } else {
    out.push({ surface, cond: null, harmony: keepHarmony });
  }
  // A verb stem ending in a vowel drops it before -Iyor: gelme -> gelm-iyor.
  if (leadsToVerb && endsWithVowel(surface)) {
    const dropped = surface.slice(0, -1);
    const lv = lastVowel(prev + dropped);
    out.push({ surface: dropped, cond: 'prog', harmony: lv ? undefined : surface[surface.length - 1] });
  }
  return out;
}

function scoreOf(morphemes, penalty, rank) {
  const count = morphemes.filter((m) => m.surface).length;
  // Frequency rank breaks ties only (rank 1 -> ~0, unknown -> 0.1).
  const freq = Number.isFinite(rank) ? Math.min(rank, 100000) / 1e6 : 0.1;
  return count + penalty + freq;
}

function walk(word, pos, stateName, prev, cond, harmony, ctx, path, results) {
  if (results.length >= MAX_RESULTS) return;
  const state = STATES[stateName];

  if (pos === word.length) {
    if (state.terminal && endAllowed(cond)) {
      results.push({
        root: ctx.root,
        suffixes: path.slice(),
        score: scoreOf(path, ctx.penalty, ctx.root.rank),
      });
    }
    return;
  }

  for (const tr of state.next) {
    if (DERIVATIONAL.has(tr.s) && ctx.derivations >= MAX_DERIVATIONS) continue;
    for (const cand of realizeTransition(tr, prev, harmony, ctx)) {
      const { surface } = cand;
      if (!surface || !word.startsWith(surface, pos)) continue;
      if (!satisfies(cond, surface, tr.s)) continue;

      const added = [];
      if (tr.aorNeg) added.push({ id: 'AorNeg', surface: '' });
      added.push({ id: tr.s, surface });

      const saved = { penalty: ctx.penalty, derivations: ctx.derivations, aoristA: ctx.aoristA };
      ctx.penalty += tr.penalty ?? 0;
      if (DERIVATIONAL.has(tr.s)) ctx.derivations += 1;
      // Only the bare root decides between -Ar and -Ir.
      if (VERB_STATES.has(tr.to) || DERIVATIONAL.has(tr.s)) ctx.aoristA = false;

      path.push(...added);
      walk(word, pos + surface.length, tr.to, prev + surface, cand.cond, cand.harmony, ctx, path, results);
      path.length -= added.length;
      Object.assign(ctx, saved);
    }
  }
}

function formatResult(r, lexicon) {
  const lemmaKey = trLower(r.root.lemma);
  return {
    root: {
      lemma: r.root.lemma,
      pos: r.root.pos,
      surface: r.root.surface,
      gloss: lexicon.gloss(lemmaKey, r.root.pos),
    },
    suffixes: r.suffixes.map((m) => ({
      id: m.id,
      surface: m.surface,
      en: SUFFIXES[m.id].en,
      tr: SUFFIXES[m.id].tr,
      term: SUFFIXES[m.id].term,
    })),
    score: Math.round(r.score * 1000) / 1000,
  };
}

/** Key that treats noun/adjective/adverb readings of the same split as one. */
function dedupeKey(r) {
  const posClass = r.root.pos === 'V' ? 'V' : 'nom';
  return `${r.root.lemma}|${posClass}|${r.suffixes.map((m) => `${m.surface}:${m.id}`).join(' ')}`;
}

export class Analyzer {
  /** @param {import('./lexicon.js').Lexicon} lexicon */
  constructor(lexicon) {
    this.lexicon = lexicon;
  }

  /**
   * Analyzes one word. Returns readings sorted best first; an empty array
   * means "not recognized".
   */
  analyze(rawWord) {
    const original = rawWord.trim().replace(/^[^\p{L}'’]+|[^\p{L}]+$/gu, '');
    if (!original) return [];

    const apostrophe = original.search(APOSTROPHES);
    if (apostrophe > 0) return this.analyzeProper(original, apostrophe);

    const word = trLower(original);
    const results = [];

    const irregular = IRREGULAR_WORDS[word];
    if (irregular) {
      const [lemma, pos, sfx, surface] = irregular;
      results.push({
        root: { lemma, pos, surface: surface ?? lemma, rank: 1 },
        suffixes: sfx.map(([s, id]) => ({ id, surface: s })),
        score: sfx.length - 0.5,
      });
    }

    const maxLen = Math.min(word.length, this.lexicon.maxLen);
    for (let len = 1; len <= maxLen; len++) {
      const rootSurface = word.slice(0, len);
      for (const cand of this.lexicon.lookup(rootSurface)) {
        const { entry } = cand;
        const ctx = {
          root: { lemma: entry.lemma, pos: entry.pos, surface: rootSurface, rank: entry.rank },
          // Proper nouns matched without an apostrophe (ba, ala) are a weak reading.
          penalty: entry.pos === 'Prop' ? 0.5 : 0,
          derivations: 0,
          aoristA: entry.pos === 'V' && entry.flags.has('Aorist_A'),
        };
        if (cand.cond === 'suffix' && len === word.length) continue;
        const cond = cand.cond === 'suffix' ? null : cand.cond;
        walk(word, len, startState(entry.pos, entry.lemma), rootSurface, cond, cand.harmony, ctx, [], results);
      }
    }
    return this.rank(results);
  }

  /** "İstanbul'da", "Ali'nin": the part before the apostrophe is the root. */
  analyzeProper(original, at) {
    const rootRaw = original.slice(0, at);
    const rest = trLower(original.slice(at + 1));
    const rootSurface = trLower(rootRaw);
    const known = this.lexicon.entries(rootSurface)[0];
    const lv = lastVowel(rootSurface);
    const harmony = known?.flags.has('InverseHarmony') && lv ? frontOf(lv) : undefined;
    const ctx = {
      root: { lemma: rootRaw, pos: 'Prop', surface: rootRaw, rank: known?.rank ?? Infinity },
      penalty: 0,
      derivations: MAX_DERIVATIONS, // no derivation after a proper noun
      aoristA: false,
    };
    if (!rest) return this.rank([{ root: ctx.root, suffixes: [], score: 0 }]);
    const results = [];
    // Walk over the lowercase word, but treat the root as already matched.
    const word = rootSurface + rest;
    walk(word, rootSurface.length, 'N_ROOT', rootSurface, null, harmony, ctx, [], results);
    return this.rank(results);
  }

  rank(results) {
    results.sort((a, b) => a.score - b.score);
    const seen = new Set();
    const out = [];
    for (const r of results) {
      const key = dedupeKey(r);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(formatResult(r, this.lexicon));
    }
    return out;
  }
}

/** Formats a reading as "git + eme + yecek + ler + miş". */
export function segmentation(reading) {
  return [reading.root.surface, ...reading.suffixes.filter((s) => s.surface).map((s) => s.surface)].join(' + ');
}
