import {
  FixedSizeArray,
  verifyFixedSize,
  verifyInstance,
} from 'app/utils/ts-utils';

export class GPTStatistic {
  percentiles: FixedSizeArray<number, 11>;
  upperQuartile: number;
  lowerQuartile: number;
  lowerWhisker: number;
  upperWhisker: number;
  strayBulletsLower: number;
  strayBulletsUpper: number;
  count: number;

  constructor({
    percentiles = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    upperQuartile = 0,
    lowerQuartile = 0,
    lowerWhisker = 0,
    upperWhisker = 0,
    strayBulletsLower = 0,
    strayBulletsUpper = 0,
    count = 0,
  }: GPTStatistic) {
    this.percentiles = verifyFixedSize(percentiles, 11);
    this.upperQuartile = upperQuartile;
    this.lowerQuartile = lowerQuartile;
    this.lowerWhisker = lowerWhisker;
    this.upperWhisker = upperWhisker;
    this.strayBulletsLower = strayBulletsLower;
    this.strayBulletsUpper = strayBulletsUpper;
    this.count = count;
  }
}

export class GPTStatistics {
  promptTokens: GPTStatistic;
  completionTokens: GPTStatistic;
  accumulatedQuota: number;
  weeklyQuota: number;
  dailyQuota: number;
  lastUsed: Date;

  constructor({
    promptTokens = {} as GPTStatistic,
    completionTokens = {} as GPTStatistic,
    accumulatedQuota = 0,
    weeklyQuota = 0,
    dailyQuota = 0,
    lastUsed = null,
  }: GPTStatistics) {
    this.promptTokens = verifyInstance(GPTStatistic, promptTokens);
    this.completionTokens = verifyInstance(GPTStatistic, completionTokens);
    this.accumulatedQuota = accumulatedQuota;
    this.weeklyQuota = weeklyQuota;
    this.dailyQuota = dailyQuota;
    this.lastUsed = verifyInstance(Date, lastUsed);
  }
}
