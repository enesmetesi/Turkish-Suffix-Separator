// Suffix order (morphotactics) as a small state machine.
//
// Each state lists the suffixes that may follow it and the state each one
// leads to. "terminal" states may end a word. Transition fields:
//   s        suffix id from SUFFIXES
//   to       next state
//   form     template override (e.g. the n-buffered cases after -(s)I)
//   penalty  added to the ranking score (higher = less likely reading)
//   special  'aor' | 'pass' | 'caus' | 'recip' (allomorphs chosen by the stem),
//            'prog' (-Iyor), 'consonantStem' (only after a consonant)
//   aorNeg   marks gelmem / gelmeyiz, where the negative aorist has no letter

const t = (s, to, extra = {}) => ({ s, to, ...extra });

// --- Building blocks ---------------------------------------------------------

// P2sg (evin "your house") shares its form with the genitive (evin "of the
// house"); the genitive is the more common reading, so P2sg ranks just below.
const POSSESSIVES = [
  t('P1sg', 'N_POSS'), t('P2sg', 'N_POSS', { penalty: 0.05 }), t('P3sg', 'N_POSS3'),
  t('P1pl', 'N_POSS'), t('P2pl', 'N_POSS'), t('P3pl', 'N_POSS3'),
];
// After the plural: kitapları = kitap-lar-ı (his books / their books).
const POSSESSIVES_AFTER_PL = [
  t('P1sg', 'N_POSS'), t('P2sg', 'N_POSS'), t('P3sg', 'N_POSS3', { form: 'I' }),
  t('P1pl', 'N_POSS'), t('P2pl', 'N_POSS'), t('P3pl', 'N_POSS3', { form: 'I' }),
];
const CASES = [
  t('Acc', 'N_CASE'), t('Dat', 'N_CASE'), t('Loc', 'N_LOC'),
  t('Abl', 'N_CASE_COP'), t('Gen', 'N_GEN'), t('Ins', 'N_CASE_COP'),
];
// Pronominal n after 3rd person possessive and -ki: evini, evinde, evdekini.
const CASES_N = [
  t('Acc', 'N_CASE', { form: 'nI' }), t('Dat', 'N_CASE', { form: 'nA' }),
  t('Loc', 'N_LOC', { form: 'nDA' }), t('Abl', 'N_CASE_COP', { form: 'nDAn' }),
  t('Gen', 'N_GEN', { form: 'nIn' }), t('Ins', 'N_CASE_COP', { form: '(y)lA' }),
];

// Person endings.
const personZ = (a3plTo) => [
  t('A1sg', 'P_END_Z'), t('A2sg', 'P_END_Z'), t('A1pl', 'P_END_Z'),
  t('A2pl', 'P_END_Z'), t('A3pl', a3plTo),
];
const PERSON_K = [
  t('A1sgK', 'END'), t('A2sgK', 'END'), t('A1plK', 'END'),
  t('A2plK', 'END'), t('A3pl', 'END'),
];

// Copula after a tense (geliyordu, gelecekmiş, gelirse).
const COPULA_AFTER_TENSE = [
  t('CopPast', 'PERS_K'), t('CopNarr', 'PERS_Z_FINAL'), t('CopCond', 'PERS_K'),
];
// Copula on a noun (öğretmendi, evdeymiş, hastaysa), plus zero-copula person
// (öğretmenim "I am a teacher"), -DIr and -ken.
const NOMINAL_COPULA = [
  t('CopPast', 'PERS_K'), t('CopNarr', 'PERS_Z_FINAL'), t('CopCond', 'PERS_K'),
  t('A1sg', 'P_END_Z', { penalty: 1.5 }), t('A2sg', 'P_END_Z', { penalty: 1.5 }),
  t('A1pl', 'P_END_Z', { penalty: 1.5 }), t('A2pl', 'P_END_Z', { penalty: 1.5 }),
  t('Cop', 'END_DIR'), t('While', 'END'),
];

const NOUN_DERIVATION = [
  t('With', 'N_ROOT', { penalty: 0.2 }), t('Without', 'N_ROOT', { penalty: 0.2 }),
  t('Ness', 'N_ROOT', { penalty: 0.2 }), t('Agt', 'N_ROOT', { penalty: 0.2 }),
  t('Equ', 'N_ROOT', { penalty: 0.4 }), t('Dim', 'N_ROOT', { penalty: 0.4 }),
  t('Sal', 'N_ROOT', { penalty: 0.2 }),
  t('Become', 'V_ROOT', { penalty: 0.3 }), t('Verbal', 'V_ROOT', { penalty: 0.3 }),
];

const NOUN_INFLECTION = [
  t('Pl', 'N_PL'), ...POSSESSIVES, ...CASES, ...NOMINAL_COPULA,
];

// Tenses and moods shared by positive and negative verb stems.
const TENSES_COMMON = [
  t('Past', 'T_PAST'), t('Narr', 'T_NARR'), t('Prog', 'T_PROG', { special: 'prog' }),
  t('Fut', 'T_FUT'), t('Nec', 'T_NEC'), t('Cond', 'T_COND'), t('Opt', 'T_OPT'),
];
const VERBALS_COMMON = [
  t('Inf', 'VN_MAK'), t('VNoun', 'N_INFL'), t('PartAn', 'N_INFL', { penalty: 0.2 }),
  t('PartDik', 'POSS_ONLY', { penalty: 0.2 }), t('PartFut', 'POSS_ONLY', { penalty: 0.3 }),
  t('CvIp', 'END'), t('CvArak', 'END'), t('CvInca', 'END'), t('CvDikca', 'END'),
];
const IMPERATIVE = [
  t('Imp3sg', 'END', { penalty: 0.2 }), t('Imp2pl', 'END', { penalty: 0.2 }),
  t('Imp2plF', 'END', { penalty: 0.2 }), t('Imp3pl', 'END', { penalty: 0.2 }),
];
const VERB_DERIVATION = [
  t('AgtV', 'N_ROOT', { penalty: 0.5 }), t('Man', 'N_ROOT', { penalty: 0.8 }),
  t('Instr', 'N_ROOT', { penalty: 0.8 }), t('Act', 'N_ROOT', { penalty: 0.8, special: 'consonantStem' }),
];

// --- States ------------------------------------------------------------------

export const STATES = {
  // Nouns, adjectives, pronouns, proper nouns.
  N_ROOT: { terminal: true, nominal: true, next: [...NOUN_INFLECTION, ...NOUN_DERIVATION] },
  // A noun-like word that does not derive further (gelme, gelen, gelecek).
  N_INFL: { terminal: true, nominal: true, next: NOUN_INFLECTION },
  NUM_ROOT: {
    terminal: true, nominal: true,
    next: [...NOUN_INFLECTION, t('Ord', 'N_ROOT'), t('Dist', 'N_ROOT')],
  },
  N_PL: { terminal: true, next: [...POSSESSIVES_AFTER_PL, ...CASES, ...NOMINAL_COPULA.filter((x) => x.s !== 'A1sg' && x.s !== 'A2sg')] },
  N_POSS: { terminal: true, next: [...CASES, ...NOMINAL_COPULA] },
  N_POSS3: { terminal: true, next: [...CASES_N, ...NOMINAL_COPULA] },
  N_CASE: { terminal: true, next: [] },
  N_CASE_COP: { terminal: true, next: NOMINAL_COPULA },
  N_LOC: { terminal: true, next: [t('Rel', 'N_REL'), ...NOMINAL_COPULA] },
  N_GEN: { terminal: true, next: [t('Rel', 'N_REL'), ...NOMINAL_COPULA] },
  N_REL: { terminal: true, next: [t('Pl', 'N_PL'), ...CASES_N, ...NOMINAL_COPULA] },
  // -DIk and participle -AcAk need a possessive: geldiğim, gideceği.
  POSS_ONLY: { terminal: false, next: POSSESSIVES },
  // Personal and demonstrative pronouns: no possessive (beni is "me", not
  // "his I"); kendi takes possessives and is listed as N_ROOT below.
  PRON_ROOT: {
    terminal: true, nominal: true,
    next: [t('Pl', 'N_PL'), ...CASES, ...NOMINAL_COPULA, t('Equ', 'N_ROOT', { penalty: 0.4 })],
  },
  // Adverbs: şimdi, şimdiki, sonraki.
  ADV_ROOT: { terminal: true, next: [t('Rel', 'N_REL')] },
  // Question particle: mı, mısın, mıydı, midir.
  Q_ROOT: {
    terminal: true,
    next: [...personZ('P_END_Z'), t('CopPast', 'PERS_K'), t('CopNarr', 'PERS_Z_FINAL'), t('Cop', 'END_DIR')],
  },
  // Words that take no suffix in v1 (ve, ama, gibi, için...).
  BARE: { terminal: true, next: [] },

  // Verbs.
  V_ROOT: {
    terminal: true, verb: true,
    next: [
      t('Pass', 'V_ROOT', { special: 'pass' }), t('Caus', 'V_ROOT', { special: 'caus' }), t('Recip', 'V_ROOT', { penalty: 0.3, special: 'recip' }),
      t('Abil', 'V_ABIL'), t('Unable', 'V_UNABLE'), t('Neg', 'V_NEG'),
      ...TENSES_COMMON, t('Aor', 'T_AOR', { special: 'aor' }),
      ...VERBALS_COMMON, t('VNounIs', 'N_INFL'), t('CvMadan', 'END'), t('CvAli', 'END'),
      ...IMPERATIVE, ...VERB_DERIVATION,
    ],
  },
  V_ABIL: {
    terminal: false, verb: true,
    next: [
      t('Neg', 'V_NEG'), ...TENSES_COMMON, t('Aor', 'T_AOR', { special: 'aor' }),
      ...VERBALS_COMMON, t('CvMadan', 'END'),
    ],
  },
  V_NEG: { terminal: true, verb: true, next: null }, // filled below
  V_UNABLE: { terminal: false, verb: true, next: null },

  T_PAST: { terminal: true, next: [...PERSON_K, t('CopCond', 'PERS_K'), t('CopNarr', 'PERS_Z_FINAL', { penalty: 0.5 })] },
  T_NARR: { terminal: true, next: [...personZ('P_A3PL'), t('CopPast', 'PERS_K'), t('CopCond', 'PERS_K'), t('Cop', 'END_DIR'), t('While', 'END')] },
  T_PROG: { terminal: true, next: [...personZ('P_A3PL'), ...COPULA_AFTER_TENSE, t('Cop', 'END_DIR'), t('While', 'END')] },
  T_FUT: { terminal: true, next: [...personZ('P_A3PL'), ...COPULA_AFTER_TENSE, t('Cop', 'END_DIR'), t('While', 'END')] },
  T_AOR: { terminal: true, next: [...personZ('P_A3PL'), ...COPULA_AFTER_TENSE, t('While', 'END')] },
  T_AORNEG: {
    terminal: true,
    next: [t('A2sg', 'P_END_Z'), t('A2pl', 'P_END_Z'), t('A3pl', 'P_A3PL'), ...COPULA_AFTER_TENSE, t('While', 'END')],
  },
  T_NEC: { terminal: true, next: [...personZ('P_A3PL'), t('CopPast', 'PERS_K'), t('CopNarr', 'PERS_Z_FINAL'), t('Cop', 'END_DIR')] },
  T_COND: { terminal: true, next: [...PERSON_K, t('CopPast', 'PERS_K'), t('CopNarr', 'PERS_Z_FINAL')] },
  T_OPT: { terminal: false, next: [t('A1sgOpt', 'END'), t('A1plOpt', 'END')] },

  VN_MAK: { terminal: true, next: [t('Loc', 'N_LOC'), t('Abl', 'N_CASE_COP'), t('Ins', 'N_CASE_COP'), t('Cop', 'END_DIR')] },

  PERS_K: { terminal: true, next: PERSON_K },
  PERS_Z_FINAL: { terminal: true, next: personZ('END') },
  P_END_Z: { terminal: true, next: [t('Cop', 'END_DIR')] },
  // gidiyorlardı, gidecekler-miş, gelirlerse, gelmişlerdir.
  P_A3PL: {
    terminal: true,
    next: [t('CopPast', 'END'), t('CopNarr', 'END'), t('CopCond', 'END'), t('Cop', 'END_DIR')],
  },
  END_DIR: { terminal: true, next: [t('A3pl', 'END', { penalty: 0.5 })] },
  END: { terminal: true, next: [] },
};

// Negative stems (gelme-, geleme-) share their transitions. The negative
// aorist has its own allomorphs: gelmez, but gelmem / gelmeyiz.
const NEG_NEXT = [
  ...TENSES_COMMON,
  t('AorNeg', 'T_AORNEG'),
  t('A1sg', 'END', { form: 'm', aorNeg: true }),
  t('A1pl', 'END', { form: 'yIz', aorNeg: true }),
  ...VERBALS_COMMON,
  ...IMPERATIVE,
];
STATES.V_NEG.next = NEG_NEXT;
STATES.V_UNABLE.next = NEG_NEXT;

/** Start state for a root of the given part of speech. */
export function startState(pos, lemma = '') {
  switch (pos) {
    case 'V': return 'V_ROOT';
    case 'Pron': return lemma === 'kendi' ? 'N_ROOT' : 'PRON_ROOT';
    case 'N': case 'Adj': case 'Prop': return 'N_ROOT';
    case 'Num': return 'NUM_ROOT';
    case 'Adv': return 'ADV_ROOT';
    case 'Ques': return 'Q_ROOT';
    default: return 'BARE';
  }
}

export const VERB_STATES = new Set(['V_ROOT', 'V_ABIL', 'V_NEG', 'V_UNABLE']);
