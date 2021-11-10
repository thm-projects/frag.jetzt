import { ProfanityFilter } from '../../../../models/room';

export interface TopicCloudAdminDataScoring {
  score: number;
}

export enum TopicCloudAdminDataScoringKey {
  countComments = 'countComments',
  countUsers = 'countUsers',
  countSelectedByQuestioner = 'countSelectedByQuestioner',
  countKeywordByModerator = 'countKeywordByModerator',
  countKeywordByCreator = 'countKeywordByCreator',
  countCommentsAnswered = 'countCommentsAnswered',
  summedUpvotes = 'summedUpvotes',
  summedDownvotes = 'summedDownvotes',
  summedVotes = 'summedVotes',
  cappedSummedVotes = 'cappedSummedVotes',
  controversy = 'controversy'
}

export type TopicCloudAdminDataScoringObject = {
  [key in TopicCloudAdminDataScoringKey]: TopicCloudAdminDataScoring;
};

export interface TopicCloudAdminData {
  blacklist: string[];
  wantedLabels: {
    de: string[];
    en: string[];
  };
  considerVotes: boolean;
  profanityFilter: ProfanityFilter;
  blacklistIsActive: boolean;
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
  for (const option of Object.keys(TopicCloudAdminDataScoringKey)) {
    if (data.scorings[option]) {
      continue;
    }
    switch (option) {
      case TopicCloudAdminDataScoringKey.cappedSummedVotes:
        data.scorings[option] = {
          score: 0.1
        };
        break;
      case TopicCloudAdminDataScoringKey.countUsers:
        data.scorings[option] = {
          score: 0.5
        };
        break;
      case TopicCloudAdminDataScoringKey.countCommentsAnswered:
      case TopicCloudAdminDataScoringKey.countKeywordByCreator:
      case TopicCloudAdminDataScoringKey.countKeywordByModerator:
      case TopicCloudAdminDataScoringKey.countSelectedByQuestioner:
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
  [key in TopicCloudAdminDataScoringKey]: {
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
  countCommentsAnswered: { min: -5, max: 5 },
  summedUpvotes: { min: -5, max: 5 },
  summedDownvotes: { min: -5, max: 5 },
  summedVotes: { min: -5, max: 5 },
  cappedSummedVotes: { min: -5, max: 5 },
  controversy: { min: -5, max: 5 }
};

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

export const spacyLabels = new Labels(deLabels, enLabels);
