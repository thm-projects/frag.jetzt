import { verifyInstance } from 'app/utils/ts-utils';
import { GPTUsage } from './gpt-status';

export class GPTRestrictions {
  active: boolean;
  usage: GPTUsage;
  ipFilter: string;
  endDate: Date;
  accumulatedPlatformQuota: number;
  weeklyPlatformQuota: number;
  dailyPlatformQuota: number;
  accumulatedUserQuota: number;
  weeklyUserQuota: number;
  dailyUserQuota: number;

  constructor({
    active = false,
    usage = GPTUsage.REGISTERED_MODERATORS,
    ipFilter = '0.0.0.0/32|::/128',
    endDate = new Date(),
    accumulatedPlatformQuota = null,
    weeklyPlatformQuota = null,
    dailyPlatformQuota = null,
    accumulatedUserQuota = null,
    weeklyUserQuota = null,
    dailyUserQuota = null,
  }) {
    this.active = active;
    this.usage = usage;
    this.ipFilter = ipFilter;
    this.endDate = verifyInstance(Date, endDate);
    this.accumulatedPlatformQuota = accumulatedPlatformQuota;
    this.weeklyPlatformQuota = weeklyPlatformQuota;
    this.dailyPlatformQuota = dailyPlatformQuota;
    this.accumulatedUserQuota = accumulatedUserQuota;
    this.weeklyUserQuota = weeklyUserQuota;
    this.dailyUserQuota = dailyUserQuota;
  }
}

export class GPTConfiguration {
  apiKey: string;
  organization: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  logprobs: number;
  echo: boolean;
  stop: string | string[];
  presencePenalty: number;
  frequencyPenalty: number;
  logitBias: { [key: string]: number };
  trialCode: string;
  restrictions: GPTRestrictions;

  constructor({
    apiKey = null,
    organization = null,
    model = null,
    maxTokens = null,
    temperature = null,
    topP = null,
    logprobs = null,
    echo = null,
    stop = null,
    presencePenalty = null,
    frequencyPenalty = null,
    logitBias = null,
    trialCode = null,
    restrictions = null,
  }: GPTConfiguration) {
    this.apiKey = apiKey;
    this.organization = organization;
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.topP = topP;
    this.logprobs = logprobs;
    this.echo = echo;
    this.stop = stop;
    this.presencePenalty = presencePenalty;
    this.frequencyPenalty = frequencyPenalty;
    this.logitBias = logitBias;
    this.trialCode = trialCode;
    this.restrictions = verifyInstance(GPTRestrictions, restrictions);
  }
}
