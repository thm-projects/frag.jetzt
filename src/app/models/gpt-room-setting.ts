import { FieldsOf, verifyInstance } from 'app/utils/ts-utils';
import { GPTActivationCode } from './gpt-configuration';

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
  }: FieldsOf<GPTRoomUsageTime>) {
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
  maxDailyRoomCost: number | null;
  maxMonthlyRoomCost: number | null;
  maxMonthlyFlowingRoomCost: number | null;
  maxAccumulatedRoomCost: number | null;
  maxDailyParticipantCost: number | null;
  maxMonthlyParticipantCost: number | null;
  maxMonthlyFlowingParticipantCost: number | null;
  maxAccumulatedParticipantCost: number | null;
  maxDailyModeratorCost: number | null;
  maxMonthlyModeratorCost: number | null;
  maxMonthlyFlowingModeratorCost: number | null;
  maxAccumulatedModeratorCost: number | null;
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
  usageTimes: GPTRoomUsageTime[];
  trialCode: GPTActivationCode;
  // presets
  presetContext: string;
  presetPersonaCreator: string;
  presetPersonaModerator: string;
  presetPersonaParticipant: string;
  presetLanguage: string;
  presetFormal: boolean | null;
  presetLength: string;

  constructor({
    id = null,
    roomId = null,
    apiKey = null,
    apiOrganization = null,
    trialEnabled = false,
    maxDailyRoomCost = null,
    maxMonthlyRoomCost = null,
    maxMonthlyFlowingRoomCost = null,
    maxAccumulatedRoomCost = null,
    maxDailyParticipantCost = null,
    maxMonthlyParticipantCost = null,
    maxMonthlyFlowingParticipantCost = null,
    maxAccumulatedParticipantCost = null,
    maxDailyModeratorCost = null,
    maxMonthlyModeratorCost = null,
    maxMonthlyFlowingModeratorCost = null,
    maxAccumulatedModeratorCost = null,
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
    usageTimes = [],
    trialCode = null,
    presetContext = '',
    presetPersonaCreator = '',
    presetPersonaModerator = '',
    presetPersonaParticipant = '',
    presetLanguage = '',
    presetFormal = null,
    presetLength = '',
  }: FieldsOf<GPTRoomSetting>) {
    this.id = id;
    this.roomId = roomId;
    this.apiKey = apiKey;
    this.apiOrganization = apiOrganization;
    this.trialEnabled = trialEnabled;
    this.maxDailyRoomCost = maxDailyRoomCost;
    this.maxMonthlyRoomCost = maxMonthlyRoomCost;
    this.maxMonthlyFlowingRoomCost = maxMonthlyFlowingRoomCost;
    this.maxAccumulatedRoomCost = maxAccumulatedRoomCost;
    this.maxDailyParticipantCost = maxDailyParticipantCost;
    this.maxMonthlyParticipantCost = maxMonthlyParticipantCost;
    this.maxMonthlyFlowingParticipantCost = maxMonthlyFlowingParticipantCost;
    this.maxAccumulatedParticipantCost = maxAccumulatedParticipantCost;
    this.maxDailyModeratorCost = maxDailyModeratorCost;
    this.maxMonthlyModeratorCost = maxMonthlyModeratorCost;
    this.maxMonthlyFlowingModeratorCost = maxMonthlyFlowingModeratorCost;
    this.maxAccumulatedModeratorCost = maxAccumulatedModeratorCost;
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
    this.usageTimes = usageTimes.map((time) =>
      verifyInstance(GPTRoomUsageTime, time),
    );
    this.trialCode = verifyInstance(GPTActivationCode, trialCode);
    this.presetContext = presetContext;
    this.presetPersonaCreator = presetPersonaCreator;
    this.presetPersonaModerator = presetPersonaModerator;
    this.presetPersonaParticipant = presetPersonaParticipant;
    this.presetLanguage = presetLanguage;
    this.presetFormal = presetFormal;
    this.presetLength = presetLength;
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

  canChangePreset(): boolean {
    return ((this.rightsBitset >>> 3) & 1) > 0;
  }

  canChangeUsageTimes(): boolean {
    return ((this.rightsBitset >>> 4) & 1) > 0;
  }

  canChangeApiSettings(): boolean {
    return ((this.rightsBitset >>> 5) & 1) > 0;
  }

  allowsUnregisteredUsers(): boolean {
    return ((this.rightsBitset >>> 6) & 1) > 0;
  }
}
