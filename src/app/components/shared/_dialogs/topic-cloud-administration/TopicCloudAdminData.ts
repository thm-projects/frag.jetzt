export interface TopicCloudAdminData {
  blacklist: string[];
  wantedLabels: {
    de: string[];
    en: string[];
  };
  considerVotes: boolean;
  profanityFilter: boolean;
  blacklistIsActive: boolean;
  keywordORfulltext: KeywordOrFulltext;
}

export enum KeywordOrFulltext {
  keyword,
  fulltext,
  both
}

export interface Label {
  readonly tag: string;
  readonly label: string;
  readonly enabledByDefault: boolean;
}

export class Labels {
  readonly de: Label[];
  readonly en: Label[];

  constructor(_de: Label[], _en: Label[]) {
    this.de = _de;
    this.en = _en;
  }
}

const deLabels: Label[] = [
  {tag: 'sb', label: 'Subjekt', enabledByDefault: true},
  {tag: 'op', label: 'Präpositionalobjekt', enabledByDefault: true},
  {tag: 'og', label: 'Genitivobjekt', enabledByDefault: true},
  {tag: 'da', label: 'Dativobjekt', enabledByDefault: true},
  {tag: 'oa', label: 'Akkusativobjekt', enabledByDefault: true},
  {tag: 'pd', label: 'Prädikat', enabledByDefault: false},
  {tag: 'ag', label: 'Genitivattribut', enabledByDefault: false},
  {tag: 'app', label: 'Apposition', enabledByDefault: false},
  {tag: 'nk', label: 'Nomen Kernelement', enabledByDefault: false},
  {tag: 'mo', label: 'Modifikator', enabledByDefault: false},
  {tag: 'cj', label: 'Konjunktor', enabledByDefault: false},
  {tag: 'ROOT', label: 'Satzkernelement', enabledByDefault: false},
  {tag: 'par', label: 'Klammerzusatz', enabledByDefault: false}
];

const enLabels: Label[] = [
  {tag: 'nsubj', label: 'Nominal subject', enabledByDefault: true},
  {tag: 'pobj', label: 'Object of preposition', enabledByDefault: true},
  {tag: 'dobj', label: 'Direct object', enabledByDefault: true},
  {tag: 'compound', label: 'Compound', enabledByDefault: true},
  {tag: 'nsubjpass', label: 'Passive nominal subject', enabledByDefault: true},
  {tag: 'nummod', label: 'Numeric modifier', enabledByDefault: false},
  {tag: 'amod', label: 'Adjectival modifier', enabledByDefault: false},
  {tag: 'npadvmod', label: 'Noun phrase as adverbial modifier', enabledByDefault: false},
  {tag: 'conj', label: 'Conjunct', enabledByDefault: false},
  {tag: 'ROOT', label: 'Sentence kernel element', enabledByDefault: false},
  {tag: 'intj', label: 'Interjection', enabledByDefault: false}
];

export const spacyLabels = new Labels(deLabels, enLabels);
