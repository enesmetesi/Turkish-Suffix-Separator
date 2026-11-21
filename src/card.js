// Turns analyzer readings into what the hover card shows. Pure data, no DOM,
// so it can be tested in Node and rendered by extension/content.js.

const POS_NAMES = {
  N: 'noun', Adj: 'adjective', Adv: 'adverb', V: 'verb', Pron: 'pronoun',
  Num: 'number', Prop: 'proper noun', Postp: 'postposition', Conj: 'conjunction',
  Det: 'determiner', Interj: 'interjection', Ques: 'question particle',
};

const VOICING = { b: 'p', c: 'ç', d: 't', ğ: 'k', g: 'k' };

/** One-line explanation of how the root changed in this word, or null. */
export function rootNote(root, nextSuffix) {
  const lemma = root.lemma.toLocaleLowerCase('tr');
  const surface = root.surface.toLocaleLowerCase('tr');
  if (surface === lemma) return null;
  if (root.pos === 'Prop') return null;
  const last = lemma[lemma.length - 1];
  const sLast = surface[surface.length - 1];
  if (surface.length === lemma.length && surface.slice(0, -1) === lemma.slice(0, -1) && VOICING[sLast] === last) {
    return `${last} → ${sLast} before a vowel: ${surface}-`;
  }
  if (surface.length === lemma.length + 1 && surface.startsWith(lemma)) {
    return `${last} doubles before a vowel: ${surface}-`;
  }
  if (surface.length === lemma.length - 1 && lemma.endsWith(surface.slice(-1)) && nextSuffix?.id !== 'Prog') {
    return `the last vowel drops before a vowel: ${surface}-`;
  }
  if (nextSuffix?.id === 'Prog' && surface.length === lemma.length - 1) {
    return `final ${last} merges into -yor`;
  }
  if (root.pos === 'Pron' && surface.endsWith('n')) {
    return `${lemma} takes n before case endings: ${surface}-`;
  }
  if ((lemma === 'de' || lemma === 'ye') && surface.endsWith('i')) {
    return `e → i before y: ${surface}-`;
  }
  return `${lemma} → ${surface}`;
}

/** A suffix whose surface was cut before -Iyor (gelm-iyor). */
function suffixNote(sfx, next) {
  if (next?.id === 'Prog' && /[^aeıioöuü]$/.test(sfx.surface) && ['Neg', 'Unable', 'Verbal'].includes(sfx.id)) {
    return 'final vowel merges into -yor';
  }
  if (/ğ$/.test(sfx.surface)) return 'k → ğ before a vowel';
  if (sfx.id === 'AorNeg' && !sfx.surface) return 'no letter in the 1st person (gelmem, gelmeyiz)';
  return null;
}

/** Grammar term: 'both' (default, "locative case - bulunma hâli"), 'en' or 'tr'. */
function termOf(s, terms) {
  if (terms === 'tr') return s.tr;
  if (terms === 'en') return s.term;
  return `${s.term} - ${s.tr}`;
}

function readingModel(reading, terms) {
  const visible = reading.suffixes.filter((s) => s.surface || s.id === 'AorNeg');
  const segments = [{ text: reading.root.surface, kind: 'root', color: 0 }];
  let color = 1;
  const rows = [{
    part: reading.root.pos === 'V' ? `${reading.root.lemma}-` : reading.root.lemma,
    meaning: reading.root.gloss ?? '',
    term: `(${POS_NAMES[reading.root.pos] ?? 'word'})`,
    note: rootNote(reading.root, reading.suffixes.find((s) => s.surface)),
    color: 0,
  }];
  visible.forEach((s, i) => {
    const c = s.surface ? color++ : null;
    if (s.surface) segments.push({ text: s.surface, kind: 'suffix', color: c });
    rows.push({
      part: s.surface ? `-${s.surface}` : '(Ø)',
      meaning: s.en,
      term: termOf(s, terms),
      note: suffixNote(s, visible[i + 1]),
      color: c,
    });
  });
  return { segments, rows };
}

/**
 * @param {string} word      the word as written on the page
 * @param {object[]} readings analyzer output, best first
 * @param {object} [options]
 * @param {number} [options.maxOther] how many other readings to list
 * @param {'en'|'tr'|'both'} [options.terms] language of the grammar terms
 */
export function buildCard(word, readings, { maxOther = 3, terms = 'both' } = {}) {
  if (!readings.length) return { word, recognized: false };
  const [best, ...rest] = readings;
  return {
    word,
    recognized: true,
    ...readingModel(best, terms),
    others: rest.slice(0, maxOther).map((r) => {
      const m = readingModel(r, terms);
      return {
        text: m.segments.map((s) => s.text).join(' + '),
        summary: m.rows.slice(1).map((row) => row.meaning).join(', ') || m.rows[0].meaning,
        rootMeaning: m.rows[0].meaning,
      };
    }),
    moreCount: rest.length,
  };
}
