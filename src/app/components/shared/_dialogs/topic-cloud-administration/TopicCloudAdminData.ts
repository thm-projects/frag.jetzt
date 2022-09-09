export interface TopicCloudAdminDataScoring {
  score: number;
}

export const TopicCloudAdminDataScoringKey = [
  'countComments', 'countUsers', 'countSelectedByQuestioner', 'countKeywordByModerator', 'countKeywordByCreator',
  'summedUpvotes', 'summedDownvotes', 'summedVotes', 'cappedSummedVotes', 'controversy', 'responseCount', 'answerCount'
] as const;

export type TopicCloudAdminDataScoringObject = {
  [key in typeof TopicCloudAdminDataScoringKey[number]]: TopicCloudAdminDataScoring;
};

export interface TopicCloudAdminData {
  wantedLabels: {
    de: string[];
    en: string[];
    fr: string[];
  };
  considerVotes: boolean;
  keywordORfulltext: KeywordOrFulltext;
  minQuestions: number;
  minQuestioners: number;
  minUpvotes: number;
  startDate: string;
  endDate: string;
  scorings: TopicCloudAdminDataScoringObject;
}

export const ensureDefaultScorings = (data: TopicCloudAdminData) => {
  if (!data.scorings) {
    data.scorings = {} as TopicCloudAdminDataScoringObject;
  }
  for (const option of TopicCloudAdminDataScoringKey) {
    if (data.scorings[option]) {
      continue;
    }
    switch (option) {
      case 'cappedSummedVotes':
      case 'responseCount':
        data.scorings[option] = {
          score: 0.1
        };
        break;
      case 'countUsers':
        data.scorings[option] = {
          score: 0.5
        };
        break;
      case 'countKeywordByCreator':
      case 'countKeywordByModerator':
      case 'countSelectedByQuestioner':
      case 'answerCount':
        data.scorings[option] = {
          score: 1
        };
        break;
      default:
        data.scorings[option] = {
          score: 0
        };
        break;
    }
  }
};

export type TopicCloudAdminDataScoringPreset = {
  [key in typeof TopicCloudAdminDataScoringKey[number]]: {
    min: number;
    max: number;
  };
};

export const keywordsScoringMinMax: TopicCloudAdminDataScoringPreset = {
  countComments: { min: -5, max: 5 },
  countUsers: { min: -5, max: 5 },
  countSelectedByQuestioner: { min: -5, max: 5 },
  countKeywordByModerator: { min: -5, max: 5 },
  countKeywordByCreator: { min: -5, max: 5 },
  summedUpvotes: { min: -5, max: 5 },
  summedDownvotes: { min: -5, max: 5 },
  summedVotes: { min: -5, max: 5 },
  cappedSummedVotes: { min: -5, max: 5 },
  controversy: { min: -5, max: 5 },
  responseCount: { min: -5, max: 5 },
  answerCount: { min: -5, max: 5 },
};

export enum KeywordOrFulltext {
  Keyword,
  Fulltext,
  Both
}

export interface Label {
  readonly tag: string;
  readonly label: string;
  readonly enabledByDefault: boolean;
}

export class Labels {
  readonly de: Label[];
  readonly en: Label[];
  readonly fr: Label[];

  constructor(_de: Label[], _en: Label[], _fr: Label[]) {
    this.de = _de;
    this.en = _en;
    this.fr = _fr;
  }
}

const deLabels: Label[] = [
  { tag: 'sb', label: 'Subjekt', enabledByDefault: true },
  { tag: 'op', label: 'Präpositionalobjekt', enabledByDefault: true },
  { tag: 'og', label: 'Genitivobjekt', enabledByDefault: true },
  { tag: 'da', label: 'Dativobjekt', enabledByDefault: true },
  { tag: 'oa', label: 'Akkusativobjekt', enabledByDefault: true },
  { tag: 'ROOT', label: 'Satzkernelement', enabledByDefault: true },
  { tag: 'pd', label: 'Prädikat', enabledByDefault: false },
  { tag: 'ag', label: 'Genitivattribut', enabledByDefault: false },
  { tag: 'app', label: 'Apposition', enabledByDefault: false },
  { tag: 'nk', label: 'Nomen Kernelement', enabledByDefault: false },
  { tag: 'mo', label: 'Modifikator', enabledByDefault: false },
  { tag: 'cj', label: 'Konjunktor', enabledByDefault: false },
  { tag: 'par', label: 'Klammerzusatz', enabledByDefault: false }
];

const enLabels: Label[] = [
  { tag: 'nsubj', label: 'Nominal subject', enabledByDefault: true },
  { tag: 'pobj', label: 'Object of preposition', enabledByDefault: true },
  { tag: 'dobj', label: 'Direct object', enabledByDefault: true },
  { tag: 'compound', label: 'Compound', enabledByDefault: true },
  { tag: 'nsubjpass', label: 'Passive nominal subject', enabledByDefault: true },
  { tag: 'ROOT', label: 'Sentence kernel element', enabledByDefault: true },
  { tag: 'nummod', label: 'Numeric modifier', enabledByDefault: false },
  { tag: 'amod', label: 'Adjectival modifier', enabledByDefault: false },
  { tag: 'npadvmod', label: 'Noun phrase as adverbial modifier', enabledByDefault: false },
  { tag: 'conj', label: 'Conjunct', enabledByDefault: false },
  { tag: 'intj', label: 'Interjection', enabledByDefault: false }
];

const frLabels: Label[] = [
  { tag: 'nsubj', label: 'Sujet nominal', enabledByDefault: true },
  { tag: 'nsubj:pass', label: 'Sujet nominal passif', enabledByDefault: true },
  { tag: 'obj', label: 'Objet', enabledByDefault: true },
  { tag: 'obj:mod', label: 'Objet', enabledByDefault: true },
  { tag: 'obj:agent', label: 'Objet', enabledByDefault: true },
  { tag: 'ROOT', label: 'Élément du noyau de la phrase', enabledByDefault: true },
  { tag: 'xcomp', label: 'Complément clausal ouvert', enabledByDefault: true },
  { tag: 'ccomp', label: 'Complément clausal', enabledByDefault: true },
  { tag: 'acl', label: 'Modificateur clausal du nom (clause adjectivale)', enabledByDefault: false },
  { tag: 'acl:relcl', label: 'Modificateur clausal du nom (clause adjectivale)', enabledByDefault: false },
  { tag: 'amod', label: 'Modificateur adjectival', enabledByDefault: false },
  { tag: 'advmod', label: 'Modificateur adverbial', enabledByDefault: false },
  { tag: 'nmod', label: 'Modificateur du nominal', enabledByDefault: false },
  { tag: 'conj', label: 'Conjonction', enabledByDefault: false },
  { tag: 'appos', label: 'Modificateur appositionnel', enabledByDefault: false },
  { tag: 'dep', label: 'Non classifié dépendant', enabledByDefault: false },
  { tag: 'aux:tense', label: 'Auxiliaire forme temporelle', enabledByDefault: false },
  { tag: 'flat:name', label: 'Expression plate de plusieurs mots', enabledByDefault: false },
  { tag: 'obl:arg', label: 'Argument nominal oblique', enabledByDefault: false },
];

export const spacyLabels = new Labels(deLabels, enLabels, frLabels);
