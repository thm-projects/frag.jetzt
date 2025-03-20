export interface TopicCloudAdminDataScoring {
  score: number;
}

export const TopicCloudAdminDataScoringKey = [
  'countComments',
  'countUsers',
  'countKeywordByModerator',
  'countKeywordByCreator',
  'summedUpvotes',
  'summedDownvotes',
  'summedVotes',
  'cappedSummedVotes',
  'controversy',
  'responseCount',
  'answerCount',
] as const;

export type TopicCloudAdminDataScoringObject = {
  [key in (typeof TopicCloudAdminDataScoringKey)[number]]: TopicCloudAdminDataScoring;
};

export interface TopicCloudAdminData {
  considerVotes: boolean;
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
          score: 0.1,
        };
        break;
      case 'countUsers':
        data.scorings[option] = {
          score: 0.5,
        };
        break;
      case 'countKeywordByCreator':
      case 'countKeywordByModerator':
      case 'answerCount':
        data.scorings[option] = {
          score: 1,
        };
        break;
      default:
        data.scorings[option] = {
          score: 0,
        };
        break;
    }
  }
};

export type TopicCloudAdminDataScoringPreset = {
  [key in (typeof TopicCloudAdminDataScoringKey)[number]]: {
    min: number;
    max: number;
    score?: number;
  };
};

export const keywordsScoringMinMax: TopicCloudAdminDataScoringPreset = {
  countComments: { min: -5, max: 5 },
  countUsers: { min: -5, max: 5 },
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
