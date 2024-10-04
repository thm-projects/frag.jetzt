export type Model = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pt' | 'auto';

export type EnglishParserLabels =
  | 'ROOT' //None
  | 'acl' //clausal modifier of noun (adjectival clause)
  | 'acomp' //adjectival complement
  | 'advcl' //adverbial clause modifier
  | 'advmod' //adverbial modifier
  | 'agent' //agent
  | 'amod' //adjectival modifier
  | 'appos' //appositional modifier
  | 'attr' //attribute
  | 'aux' //auxiliary
  | 'auxpass' //auxiliary (passive)
  | 'case' //case marking
  | 'cc' //coordinating conjunction
  | 'ccomp' //clausal complement
  | 'compound' //compound
  | 'conj' //conjunct
  | 'csubj' //clausal subject
  | 'csubjpass' //clausal subject (passive)
  | 'dative' //dative
  | 'dep' //unclassified dependent
  | 'det' //determiner
  | 'dobj' //direct object
  | 'expl' //expletive
  | 'intj' //interjection
  | 'mark' //marker
  | 'meta' //meta modifier
  | 'neg' //negation modifier
  | 'nmod' //modifier of nominal
  | 'npadvmod' //noun phrase as adverbial modifier
  | 'nsubj' //nominal subject
  | 'nsubjpass' //nominal subject (passive)
  | 'nummod' //numeric modifier
  | 'oprd' //object predicate
  | 'parataxis' //parataxis
  | 'pcomp' //complement of preposition
  | 'pobj' //object of preposition
  | 'poss' //possession modifier
  | 'preconj' //pre-correlative conjunction
  | 'predet' //None
  | 'prep' //prepositional modifier
  | 'prt' //particle
  | 'punct' //punctuation
  | 'quantmod' //modifier of quantifier
  | 'relcl' //relative clause modifier
  | 'xcomp'; //open clausal complement

export type FrenchParserLabels =
  | 'ROOT' //None
  | 'acl' //clausal modifier of noun (adjectival clause)
  | 'acl:relcl' //None
  | 'advcl' //adverbial clause modifier
  | 'advmod' //adverbial modifier
  | 'amod' //adjectival modifier
  | 'appos' //appositional modifier
  | 'aux:pass' //None
  | 'aux:tense' //None
  | 'case' //case marking
  | 'cc' //coordinating conjunction
  | 'ccomp' //clausal complement
  | 'conj' //conjunct
  | 'cop' //copula
  | 'dep' //unclassified dependent
  | 'det' //determiner
  | 'expl:comp' //None
  | 'expl:pass' //None
  | 'expl:subj' //None
  | 'fixed' //fixed multiword expression
  | 'flat:foreign' //None
  | 'flat:name' //None
  | 'iobj' //indirect object
  | 'mark' //marker
  | 'nmod' //modifier of nominal
  | 'nsubj' //nominal subject
  | 'nsubj:pass' //None
  | 'nummod' //numeric modifier
  | 'obj' //object
  | 'obl:agent' //None
  | 'obl:arg' //None
  | 'obl:mod' //None
  | 'parataxis' //parataxis
  | 'punct' //punctuation
  | 'vocative' //vocative
  | 'xcomp'; //open clausal complement

export const GERMAN_TRANSLATION = {
  ROOT: 'Satzkernelement',
  ac: 'Adpositionaler Fallmarker',
  adc: 'Adjektivkomponente',
  ag: 'Genitivattribut',
  ams: 'Messargument des Adjektivs',
  app: 'Apposition',
  avc: 'Adverbiale Satzkomponente',
  cc: 'Koordinierende Konjunktion',
  cd: 'Koordinierende Konjunktion',
  cj: 'Konjunktion',
  cm: 'Vergleichende Konjunktion',
  cp: 'Komplementierer',
  cvc: 'Kollokative Verbkonstruktion',
  da: 'Dativ',
  dep: 'Nicht klassifizierte Abhängigkeit',
  dm: 'Diskursmarker',
  ep: 'Kraftausdruck es',
  ju: 'Verbindungsstelle',
  mnr: 'Postnominaler Modifikator',
  mo: 'Modifikator',
  ng: 'Negation',
  nk: 'Nomen Kernelement',
  nmc: 'Numerische Komponente',
  oa: 'Akkusativobjekt',
  oc: 'Klauselobjekt',
  og: 'Genitivobjekt',
  op: 'Präpositionalobjekt',
  par: 'Klammerelement',
  pd: 'Prädikat',
  pg: 'Genitiv',
  ph: 'Platzhalter',
  pm: 'Morphologisches Teilchen',
  pnc: 'Eigenname Komponente',
  punct: 'Zeichensetzung',
  rc: 'Relativsatz',
  re: 'Wiederholtes Element',
  rs: 'Indirekte Rede',
  sb: 'Subjekt',
  sbp: 'Passiviertes Subject',
  svp: 'Trennbares Verbpräfix',
  uc: 'Einheitskomponente',
  vo: 'Vokativ',
};

export type GermanParserLabels = keyof typeof GERMAN_TRANSLATION;

export const DEFAULT_NOUN_LABELS = {
  de: ['sb', 'op', 'og', 'da', 'oa'] as GermanParserLabels[],
  en: [] as EnglishParserLabels[],
  fr: [] as FrenchParserLabels[],
};

export const CURRENT_SUPPORTED_LANGUAGES: Model[] = ['de', 'en', 'fr'];
