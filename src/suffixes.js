// Suffix catalogue. Each suffix has an abstract template (see phonology.realize)
// and the labels the hover popup shows: a short English gloss (en), the
// grammar term in Turkish (tr) and in English (term). "voices: true" marks suffixes whose final k becomes ğ before a
// vowel (gidecek -> gideceğim).

export const SUFFIXES = {
  // --- Noun inflection ------------------------------------------------------
  Pl:     { form: 'lAr',    en: 'plural',                 tr: 'çoğul', term: 'plural' },
  P1sg:   { form: '(I)m',   en: 'my',                     tr: 'iyelik, 1. tekil', term: 'possessive, 1st sg.' },
  P2sg:   { form: '(I)n',   en: 'your (sg.)',             tr: 'iyelik, 2. tekil', term: 'possessive, 2nd sg.' },
  P3sg:   { form: '(s)I',   en: 'his / her / its',        tr: 'iyelik, 3. tekil', term: 'possessive, 3rd sg.' },
  P1pl:   { form: '(I)mIz', en: 'our',                    tr: 'iyelik, 1. çoğul', term: 'possessive, 1st pl.' },
  P2pl:   { form: '(I)nIz', en: 'your (pl.)',             tr: 'iyelik, 2. çoğul', term: 'possessive, 2nd pl.' },
  P3pl:   { form: 'lArI',   en: 'their',                  tr: 'iyelik, 3. çoğul', term: 'possessive, 3rd pl.' },
  Acc:    { form: '(y)I',   en: 'the (direct object)',    tr: 'belirtme hâli', term: 'accusative case' },
  Dat:    { form: '(y)A',   en: 'to / towards',           tr: 'yönelme hâli', term: 'dative case' },
  Loc:    { form: 'DA',     en: 'in / at / on',           tr: 'bulunma hâli', term: 'locative case' },
  Abl:    { form: 'DAn',    en: 'from',                   tr: 'ayrılma hâli', term: 'ablative case' },
  Gen:    { form: '(n)In',  en: 'of / \'s',               tr: 'ilgi hâli', term: 'genitive case' },
  Ins:    { form: '(y)lA',  en: 'with / by',              tr: 'vasıta hâli', term: 'instrumental case' },
  Rel:    { form: 'ki',     en: 'the one (in / of)',      tr: 'aitlik eki -ki', term: 'relative suffix -ki' },

  // --- Copula (ek-fiil) and person -------------------------------------------
  CopPast:  { form: '(y)DI',  en: 'was',                  tr: 'ek-fiil, hikâye', term: 'copula, past' },
  CopNarr:  { form: '(y)mIş', en: 'reportedly / apparently', tr: 'ek-fiil, rivayet', term: 'copula, reported' },
  CopCond:  { form: '(y)sA',  en: 'if',                   tr: 'ek-fiil, şart', term: 'copula, conditional' },
  Cop:      { form: 'DIr',    en: 'is (certainly / probably)', tr: 'ek-fiil, kesinlik', term: 'copula, certainty' },
  While:    { form: '(y)ken', en: 'while / when',         tr: 'zarf-fiil -ken', term: 'converb -ken' },

  A1sg:   { form: '(y)Im',  en: 'I',                      tr: 'kişi, 1. tekil', term: 'person, 1st sg.' },
  A2sg:   { form: 'sIn',    en: 'you (sg.)',              tr: 'kişi, 2. tekil', term: 'person, 2nd sg.' },
  A1pl:   { form: '(y)Iz',  en: 'we',                     tr: 'kişi, 1. çoğul', term: 'person, 1st pl.' },
  A2pl:   { form: 'sInIz',  en: 'you (pl.)',              tr: 'kişi, 2. çoğul', term: 'person, 2nd pl.' },
  A3pl:   { form: 'lAr',    en: 'they',                   tr: 'kişi, 3. çoğul', term: 'person, 3rd pl.' },
  // Short person set used after -DI and -sA (geldim, gelsen).
  A1sgK:  { form: 'm',      en: 'I',                      tr: 'kişi, 1. tekil', term: 'person, 1st sg.' },
  A2sgK:  { form: 'n',      en: 'you (sg.)',              tr: 'kişi, 2. tekil', term: 'person, 2nd sg.' },
  A1plK:  { form: 'k',      en: 'we',                     tr: 'kişi, 1. çoğul', term: 'person, 1st pl.' },
  A2plK:  { form: 'nIz',    en: 'you (pl.)',              tr: 'kişi, 2. çoğul', term: 'person, 2nd pl.' },
  // Optative persons (geleyim, gelelim).
  A1sgOpt:{ form: '(y)Im',  en: 'let me',                 tr: 'kişi, 1. tekil', term: 'person, 1st sg.' },
  A1plOpt:{ form: 'lIm',    en: 'let us',                 tr: 'kişi, 1. çoğul', term: 'person, 1st pl.' },
  // Imperative persons.
  Imp3sg: { form: 'sIn',    en: 'let him / her',          tr: 'emir, 3. tekil', term: 'imperative, 3rd sg.' },
  Imp2pl: { form: '(y)In',  en: '(you all) do!',          tr: 'emir, 2. çoğul', term: 'imperative, 2nd pl.' },
  Imp2plF:{ form: '(y)InIz',en: '(you all) please do!',   tr: 'emir, 2. çoğul (kibar)', term: 'imperative, 2nd pl. (polite)' },
  Imp3pl: { form: 'sInlAr', en: 'let them',               tr: 'emir, 3. çoğul', term: 'imperative, 3rd pl.' },

  // --- Verb: voice, ability, negation -----------------------------------------
  Pass:   { form: 'Il',     en: 'is done (passive)',      tr: 'edilgen çatı', term: 'passive voice' },
  Caus:   { form: 'DIr',    en: 'make / have someone do', tr: 'ettirgen çatı', term: 'causative voice' },
  Recip:  { form: 'Iş',     en: 'each other',             tr: 'işteş çatı', term: 'reciprocal voice' },
  Abil:   { form: '(y)Abil',en: 'can',                    tr: 'yeterlilik', term: 'ability' },
  Unable: { form: '(y)AmA', en: 'cannot',                 tr: 'yeterlilik olumsuz', term: 'inability' },
  Neg:    { form: 'mA',     en: 'not',                    tr: 'olumsuzluk', term: 'negative' },

  // --- Verb: tense, aspect, mood ----------------------------------------------
  Past:   { form: 'DI',     en: 'did (past)',             tr: 'görülen geçmiş zaman', term: 'past tense' },
  Narr:   { form: 'mIş',    en: 'has done / reportedly did', tr: 'duyulan geçmiş zaman', term: 'reported past tense' },
  Prog:   { form: 'Iyor',   en: 'is doing',               tr: 'şimdiki zaman', term: 'present continuous' },
  Fut:    { form: '(y)AcAk',en: 'will',                   tr: 'gelecek zaman', voices: true, term: 'future tense' },
  Aor:    { form: 'Ir',     en: 'does (habitually)',      tr: 'geniş zaman', term: 'aorist (simple present)' },
  AorNeg: { form: 'z',      en: 'does not (habitually)',  tr: 'geniş zaman, olumsuz', term: 'aorist, negative' },
  Nec:    { form: 'mAlI',   en: 'must',                   tr: 'gereklilik kipi', term: 'necessity mood' },
  Cond:   { form: 'sA',     en: 'if',                     tr: 'şart kipi', term: 'conditional mood' },
  Opt:    { form: '(y)A',   en: 'let / shall',            tr: 'istek kipi', term: 'optative mood' },

  // --- Verbal nouns, participles, converbs ------------------------------------
  Inf:     { form: 'mAk',   en: 'to (infinitive)',        tr: 'mastar', term: 'infinitive' },
  VNoun:   { form: 'mA',    en: 'doing / the act of',     tr: 'isim-fiil -mA', term: 'verbal noun -mA' },
  VNounIs: { form: '(y)Iş', en: 'way of doing',           tr: 'isim-fiil -Iş', term: 'verbal noun -Iş' },
  PartAn:  { form: '(y)An', en: 'who / which does',       tr: 'sıfat-fiil -An', term: 'participle -An' },
  PartDik: { form: 'DIk',   en: 'that (someone) did',     tr: 'sıfat-fiil -DIk', voices: true, term: 'participle -DIk' },
  PartFut: { form: '(y)AcAk', en: 'that (someone) will do', tr: 'sıfat-fiil -AcAk', voices: true, term: 'future participle -AcAk' },
  CvIp:    { form: '(y)Ip', en: 'and (then)',             tr: 'zarf-fiil -Ip', term: 'converb -Ip' },
  CvArak:  { form: '(y)ArAk', en: 'by doing',             tr: 'zarf-fiil -ArAk', term: 'converb -ArAk' },
  CvInca:  { form: '(y)IncA', en: 'when / as soon as',    tr: 'zarf-fiil -IncA', term: 'converb -IncA' },
  CvMadan: { form: 'mAdAn', en: 'without doing / before', tr: 'zarf-fiil -mAdAn', term: 'converb -mAdAn' },
  CvAli:   { form: '(y)AlI',en: 'since',                  tr: 'zarf-fiil -AlI', term: 'converb -AlI' },
  CvDikca: { form: 'DIkçA', en: 'the more / whenever',    tr: 'zarf-fiil -DIkçA', term: 'converb -DIkçA' },

  // --- Derivation: noun -> noun / adjective -----------------------------------
  With:    { form: 'lI',    en: 'with / having',          tr: 'yapım eki -lI', term: 'derivational -lI' },
  Without: { form: 'sIz',   en: 'without / -less',        tr: 'yapım eki -sIz', term: 'derivational -sIz' },
  Ness:    { form: 'lIk',   en: '-ness / place / thing for', tr: 'yapım eki -lIk', voices: true, term: 'derivational -lIk' },
  Agt:     { form: 'CI',    en: 'person who makes / sells', tr: 'yapım eki -CI', term: 'derivational -CI' },
  Equ:     { form: 'CA',    en: 'language / -ly / like',  tr: 'yapım eki -CA', term: 'derivational -CA' },
  Dim:     { form: 'CIk',   en: 'little',                 tr: 'küçültme eki -CIk', voices: true, term: 'diminutive -CIk' },
  Sal:     { form: 'sAl',   en: '-al / -ic',              tr: 'yapım eki -sAl', term: 'derivational -sAl' },
  Ord:     { form: '(I)ncI',en: '-th (ordinal)',          tr: 'sıra sayı eki', term: 'ordinal number' },
  Dist:    { form: '(ş)Ar', en: 'each (distributive)',    tr: 'üleştirme sayı eki', term: 'distributive number' },
  // noun -> verb
  Become:  { form: 'lAş',   en: 'to become',              tr: 'yapım eki -lAş', term: 'derivational -lAş (noun → verb)' },
  Verbal:  { form: 'lA',    en: 'to do / make',           tr: 'yapım eki -lA', term: 'derivational -lA (noun → verb)' },
  // verb -> noun
  AgtV:    { form: '(y)IcI',en: 'one who does',           tr: 'yapım eki -IcI', term: 'derivational -IcI (verb → noun)' },
  Man:     { form: 'mAn',   en: 'one who does (profession)', tr: 'yapım eki -mAn', term: 'derivational -mAn (verb → noun)' },
  Instr:   { form: 'GI',    en: 'thing for / result',     tr: 'yapım eki -GI', term: 'derivational -GI (verb → noun)' },
  Act:     { form: 'Im',    en: 'act / result of',        tr: 'yapım eki -Im', term: 'derivational -Im (verb → noun)' },
};

export const DERIVATIONAL = new Set([
  'With', 'Without', 'Ness', 'Agt', 'Equ', 'Dim', 'Sal', 'Ord', 'Dist',
  'Become', 'Verbal', 'AgtV', 'Man', 'Instr', 'Act',
]);
