import {
  FixedSizeArray,
  verifyFixedSize,
  verifyInstance,
} from 'app/utils/ts-utils';
import { GPTQuotaUnit } from './gpt-configuration';

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
  dailyCounter: GPTQuotaUnit;
  weeklyCounter: GPTQuotaUnit;
  monthlyCounter: GPTQuotaUnit;
  accumulatedCounter: GPTQuotaUnit;

  constructor({
    lastUpdate = null,
    dailyCounter = null,
    weeklyCounter = null,
    monthlyCounter = null,
    accumulatedCounter = null,
  }: GPTStatistics) {
    this.lastUpdate = verifyInstance(Date, lastUpdate);
    this.dailyCounter = verifyInstance(GPTQuotaUnit, dailyCounter);
    this.weeklyCounter = verifyInstance(GPTQuotaUnit, weeklyCounter);
    this.monthlyCounter = verifyInstance(GPTQuotaUnit, monthlyCounter);
    this.accumulatedCounter = verifyInstance(GPTQuotaUnit, accumulatedCounter);
  }
}
