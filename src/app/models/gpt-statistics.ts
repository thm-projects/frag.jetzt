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
  lastUpdate: Date;
  dailyCounter: number;
  weeklyCounter: number;
  monthlyCounter: number;
  accumulatedCounter: number;

  constructor({
    lastUpdate = null,
    dailyCounter = 0,
    weeklyCounter = 0,
    monthlyCounter = 0,
    accumulatedCounter = 0,
  }: GPTStatistics) {
    this.lastUpdate = verifyInstance(Date, lastUpdate);
    this.dailyCounter = dailyCounter;
    this.weeklyCounter = weeklyCounter;
    this.monthlyCounter = monthlyCounter;
    this.accumulatedCounter = accumulatedCounter;
  }
}
