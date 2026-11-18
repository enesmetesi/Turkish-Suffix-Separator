// Suffix catalogue. Each suffix has an abstract template (see phonology.realize)
// and the labels the hover popup shows: a short English gloss and the Turkish
// grammar term. "voices: true" marks suffixes whose final k becomes ğ before a
// vowel (gidecek -> gideceğim).

export const SUFFIXES = {
  // --- Noun inflection ------------------------------------------------------
  Pl:     { form: 'lAr',    en: 'plural',                 tr: 'çoğul' },
  P1sg:   { form: '(I)m',   en: 'my',                     tr: 'iyelik, 1. tekil' },
  P2sg:   { form: '(I)n',   en: 'your (sg.)',             tr: 'iyelik, 2. tekil' },
  P3sg:   { form: '(s)I',   en: 'his / her / its',        tr: 'iyelik, 3. tekil' },
  P1pl:   { form: '(I)mIz', en: 'our',                    tr: 'iyelik, 1. çoğul' },
  P2pl:   { form: '(I)nIz', en: 'your (pl.)',             tr: 'iyelik, 2. çoğul' },
  P3pl:   { form: 'lArI',   en: 'their',                  tr: 'iyelik, 3. çoğul' },
  Acc:    { form: '(y)I',   en: 'the (direct object)',    tr: 'belirtme hâli' },
  Dat:    { form: '(y)A',   en: 'to / towards',           tr: 'yönelme hâli' },
  Loc:    { form: 'DA',     en: 'in / at / on',           tr: 'bulunma hâli' },
  Abl:    { form: 'DAn',    en: 'from',                   tr: 'ayrılma hâli' },
  Gen:    { form: '(n)In',  en: 'of / \'s',               tr: 'ilgi hâli' },
  Ins:    { form: '(y)lA',  en: 'with / by',              tr: 'vasıta hâli' },
  Rel:    { form: 'ki',     en: 'the one (in / of)',      tr: 'aitlik eki -ki' },

  // --- Copula (ek-fiil) and person -------------------------------------------
  CopPast:  { form: '(y)DI',  en: 'was',                  tr: 'ek-fiil, hikâye' },
  CopNarr:  { form: '(y)mIş', en: 'reportedly / apparently', tr: 'ek-fiil, rivayet' },
  CopCond:  { form: '(y)sA',  en: 'if',                   tr: 'ek-fiil, şart' },
  Cop:      { form: 'DIr',    en: 'is (certainly / probably)', tr: 'ek-fiil, kesinlik' },
  While:    { form: '(y)ken', en: 'while / when',         tr: 'zarf-fiil -ken' },

  A1sg:   { form: '(y)Im',  en: 'I',                      tr: 'kişi, 1. tekil' },
  A2sg:   { form: 'sIn',    en: 'you (sg.)',              tr: 'kişi, 2. tekil' },
  A1pl:   { form: '(y)Iz',  en: 'we',                     tr: 'kişi, 1. çoğul' },
  A2pl:   { form: 'sInIz',  en: 'you (pl.)',              tr: 'kişi, 2. çoğul' },
  A3pl:   { form: 'lAr',    en: 'they',                   tr: 'kişi, 3. çoğul' },
  // Short person set used after -DI and -sA (geldim, gelsen).
  A1sgK:  { form: 'm',      en: 'I',                      tr: 'kişi, 1. tekil' },
  A2sgK:  { form: 'n',      en: 'you (sg.)',              tr: 'kişi, 2. tekil' },
  A1plK:  { form: 'k',      en: 'we',                     tr: 'kişi, 1. çoğul' },
  A2plK:  { form: 'nIz',    en: 'you (pl.)',              tr: 'kişi, 2. çoğul' },
  // Optative persons (geleyim, gelelim).
  A1sgOpt:{ form: '(y)Im',  en: 'let me',                 tr: 'kişi, 1. tekil' },
  A1plOpt:{ form: 'lIm',    en: 'let us',                 tr: 'kişi, 1. çoğul' },
  // Imperative persons.
  Imp3sg: { form: 'sIn',    en: 'let him / her',          tr: 'emir, 3. tekil' },
  Imp2pl: { form: '(y)In',  en: '(you all) do!',          tr: 'emir, 2. çoğul' },
  Imp2plF:{ form: '(y)InIz',en: '(you all) please do!',   tr: 'emir, 2. çoğul (kibar)' },
  Imp3pl: { form: 'sInlAr', en: 'let them',               tr: 'emir, 3. çoğul' },

  // --- Verb: voice, ability, negation -----------------------------------------
  Pass:   { form: 'Il',     en: 'is done (passive)',      tr: 'edilgen çatı' },
  Caus:   { form: 'DIr',    en: 'make / have someone do', tr: 'ettirgen çatı' },
  Recip:  { form: 'Iş',     en: 'each other',             tr: 'işteş çatı' },
  Abil:   { form: '(y)Abil',en: 'can',                    tr: 'yeterlilik' },
  Unable: { form: '(y)AmA', en: 'cannot',                 tr: 'yeterlilik olumsuz' },
  Neg:    { form: 'mA',     en: 'not',                    tr: 'olumsuzluk' },

  // --- Verb: tense, aspect, mood ----------------------------------------------
  Past:   { form: 'DI',     en: 'did (past)',             tr: 'görülen geçmiş zaman' },
  Narr:   { form: 'mIş',    en: 'has done / reportedly did', tr: 'duyulan geçmiş zaman' },
  Prog:   { form: 'Iyor',   en: 'is doing',               tr: 'şimdiki zaman' },
  Fut:    { form: '(y)AcAk',en: 'will',                   tr: 'gelecek zaman', voices: true },
  Aor:    { form: 'Ir',     en: 'does (habitually)',      tr: 'geniş zaman' },
  AorNeg: { form: 'z',      en: 'does not (habitually)',  tr: 'geniş zaman, olumsuz' },
  Nec:    { form: 'mAlI',   en: 'must',                   tr: 'gereklilik kipi' },
  Cond:   { form: 'sA',     en: 'if',                     tr: 'şart kipi' },
  Opt:    { form: '(y)A',   en: 'let / shall',            tr: 'istek kipi' },

  // --- Verbal nouns, participles, converbs ------------------------------------
  Inf:     { form: 'mAk',   en: 'to (infinitive)',        tr: 'mastar' },
  VNoun:   { form: 'mA',    en: 'doing / the act of',     tr: 'isim-fiil -mA' },
  VNounIs: { form: '(y)Iş', en: 'way of doing',           tr: 'isim-fiil -Iş' },
  PartAn:  { form: '(y)An', en: 'who / which does',       tr: 'sıfat-fiil -An' },
  PartDik: { form: 'DIk',   en: 'that (someone) did',     tr: 'sıfat-fiil -DIk', voices: true },
  PartFut: { form: '(y)AcAk', en: 'that (someone) will do', tr: 'sıfat-fiil -AcAk', voices: true },
  CvIp:    { form: '(y)Ip', en: 'and (then)',             tr: 'zarf-fiil -Ip' },
  CvArak:  { form: '(y)ArAk', en: 'by doing',             tr: 'zarf-fiil -ArAk' },
  CvInca:  { form: '(y)IncA', en: 'when / as soon as',    tr: 'zarf-fiil -IncA' },
  CvMadan: { form: 'mAdAn', en: 'without doing / before', tr: 'zarf-fiil -mAdAn' },
  CvAli:   { form: '(y)AlI',en: 'since',                  tr: 'zarf-fiil -AlI' },
  CvDikca: { form: 'DIkçA', en: 'the more / whenever',    tr: 'zarf-fiil -DIkçA' },

  // --- Derivation: noun -> noun / adjective -----------------------------------
  With:    { form: 'lI',    en: 'with / having',          tr: 'yapım eki -lI' },
  Without: { form: 'sIz',   en: 'without / -less',        tr: 'yapım eki -sIz' },
  Ness:    { form: 'lIk',   en: '-ness / place / thing for', tr: 'yapım eki -lIk', voices: true },
  Agt:     { form: 'CI',    en: 'person who makes / sells', tr: 'yapım eki -CI' },
  Equ:     { form: 'CA',    en: 'language / -ly / like',  tr: 'yapım eki -CA' },
  Dim:     { form: 'CIk',   en: 'little',                 tr: 'küçültme eki -CIk', voices: true },
  Sal:     { form: 'sAl',   en: '-al / -ic',              tr: 'yapım eki -sAl' },
  Ord:     { form: '(I)ncI',en: '-th (ordinal)',          tr: 'sıra sayı eki' },
  Dist:    { form: '(ş)Ar', en: 'each (distributive)',    tr: 'üleştirme sayı eki' },
  // noun -> verb
  Become:  { form: 'lAş',   en: 'to become',              tr: 'yapım eki -lAş' },
  Verbal:  { form: 'lA',    en: 'to do / make',           tr: 'yapım eki -lA' },
  // verb -> noun
  AgtV:    { form: '(y)IcI',en: 'one who does',           tr: 'yapım eki -IcI' },
  Man:     { form: 'mAn',   en: 'one who does (profession)', tr: 'yapım eki -mAn' },
  Instr:   { form: 'GI',    en: 'thing for / result',     tr: 'yapım eki -GI' },
  Act:     { form: 'Im',    en: 'act / result of',        tr: 'yapım eki -Im' },
};

export const DERIVATIONAL = new Set([
  'With', 'Without', 'Ness', 'Agt', 'Equ', 'Dim', 'Sal', 'Ord', 'Dist',
  'Become', 'Verbal', 'AgtV', 'Man', 'Instr', 'Act',
]);
