import { verifyInstance } from 'app/utils/ts-utils';

export enum UsageRepeatUnit {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export class GPTRoomUsageTime {
  id: string;
  settingId: string;
  repeatDuration: number | null;
  repeatUnit: UsageRepeatUnit | null;
  startDate: Date;
  endDate: Date;
  // meta information
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = null,
    settingId = null,
    repeatDuration = null,
    repeatUnit = null,
    startDate = null,
    endDate = null,
    createdAt = new Date(),
    updatedAt = null,
  }: GPTRoomUsageTime) {
    this.id = id;
    this.settingId = settingId;
    this.repeatDuration = repeatDuration;
    this.repeatUnit = repeatUnit;
    this.startDate = verifyInstance(Date, startDate);
    this.endDate = verifyInstance(Date, endDate);
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export class GPTRoomSetting {
  id: string;
  roomId: string;
  apiKey: string | null;
  apiOrganization: string | null;
  trialEnabled: boolean;
  maxDailyRoomQuota: number | null;
  maxMonthlyRoomQuota: number | null;
  maxAccumulatedRoomQuota: number | null;
  maxDailyParticipantQuota: number | null;
  maxMonthlyParticipantQuota: number | null;
  maxAccumulatedParticipantQuota: number | null;
  maxDailyModeratorQuota: number | null;
  maxMonthlyModeratorQuota: number | null;
  maxAccumulatedModeratorQuota: number | null;
  // stats
  dailyQuotaCounter: number;
  monthlyQuotaCounter: number;
  accumulatedQuotaCounter: number;
  dailyCostCounter: number;
  monthlyCostCounter: number;
  accumulatedCostCounter: number;
  lastQuotaUsage: Date;
  // rights
  rightsBitset: number;
  // payment
  paymentCounter: number;
  // meta information
  createdAt: Date;
  updatedAt: Date | null;
  // additional transient
  keywords: string[];
  usageTimes: GPTRoomUsageTime[];

  constructor({
    id = null,
    roomId = null,
    apiKey = null,
    apiOrganization = null,
    trialEnabled = false,
    maxDailyRoomQuota = null,
    maxMonthlyRoomQuota = null,
    maxAccumulatedRoomQuota = null,
    maxDailyParticipantQuota = null,
    maxMonthlyParticipantQuota = null,
    maxAccumulatedParticipantQuota = null,
    maxDailyModeratorQuota = null,
    maxMonthlyModeratorQuota = null,
    maxAccumulatedModeratorQuota = null,
    dailyQuotaCounter = 0,
    monthlyQuotaCounter = 0,
    accumulatedQuotaCounter = 0,
    dailyCostCounter = 0,
    monthlyCostCounter = 0,
    accumulatedCostCounter = 0,
    lastQuotaUsage = new Date(),
    rightsBitset = 0,
    paymentCounter = 0,
    createdAt = new Date(),
    updatedAt = null,
    keywords = [],
    usageTimes = [],
  }: GPTRoomSetting) {
    this.id = id;
    this.roomId = roomId;
    this.apiKey = apiKey;
    this.apiOrganization = apiOrganization;
    this.trialEnabled = trialEnabled;
    this.maxDailyRoomQuota = maxDailyRoomQuota;
    this.maxMonthlyRoomQuota = maxMonthlyRoomQuota;
    this.maxAccumulatedRoomQuota = maxAccumulatedRoomQuota;
    this.maxDailyParticipantQuota = maxDailyParticipantQuota;
    this.maxMonthlyParticipantQuota = maxMonthlyParticipantQuota;
    this.maxAccumulatedParticipantQuota = maxAccumulatedParticipantQuota;
    this.maxDailyModeratorQuota = maxDailyModeratorQuota;
    this.maxMonthlyModeratorQuota = maxMonthlyModeratorQuota;
    this.maxAccumulatedModeratorQuota = maxAccumulatedModeratorQuota;
    this.dailyQuotaCounter = dailyQuotaCounter;
    this.monthlyQuotaCounter = monthlyQuotaCounter;
    this.accumulatedQuotaCounter = accumulatedQuotaCounter;
    this.dailyCostCounter = dailyCostCounter;
    this.monthlyCostCounter = monthlyCostCounter;
    this.accumulatedCostCounter = accumulatedCostCounter;
    this.lastQuotaUsage = verifyInstance(Date, lastQuotaUsage);
    this.rightsBitset = rightsBitset;
    this.paymentCounter = paymentCounter;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.keywords = keywords;
    this.usageTimes = usageTimes.map((time) =>
      verifyInstance(GPTRoomUsageTime, time),
    );
  }

  canChangeParticipantQuota(): boolean {
    return (this.rightsBitset & 1) > 0;
  }

  canChangeModeratorQuota(): boolean {
    return ((this.rightsBitset >>> 1) & 1) > 0;
  }

  canChangeRoomQuota(): boolean {
    return ((this.rightsBitset >>> 2) & 1) > 0;
  }

  canChangeKeywords(): boolean {
    return ((this.rightsBitset >>> 3) & 1) > 0;
  }

  canChangeUsageTimes(): boolean {
    return ((this.rightsBitset >>> 4) & 1) > 0;
  }

  canChangeApiSettings(): boolean {
    return ((this.rightsBitset >>> 5) & 1) > 0;
  }
}
