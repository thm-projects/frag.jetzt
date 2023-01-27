import { GPTUsage } from 'app/services/http/gpt.service';
import { verifyInstance } from 'app/utils/ts-utils';

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
  suffix: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  n: number;
  stream: boolean;
  logprobs: number;
  echo: boolean;
  stop: string | string[];
  presencePenalty: number;
  frequencyPenalty: number;
  bestOf: number;
  logitBias: { [key: string]: number };
  restrictions: GPTRestrictions;

  constructor({
    apiKey = null,
    organization = null,
    model = null,
    suffix = null,
    maxTokens = null,
    temperature = null,
    topP = null,
    n = null,
    stream = null,
    logprobs = null,
    echo = null,
    stop = null,
    presencePenalty = null,
    frequencyPenalty = null,
    bestOf = null,
    logitBias = null,
    restrictions = null,
  }: GPTConfiguration) {
    this.apiKey = apiKey;
    this.organization = organization;
    this.model = model;
    this.suffix = suffix;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.topP = topP;
    this.n = n;
    this.stream = stream;
    this.logprobs = logprobs;
    this.echo = echo;
    this.stop = stop;
    this.presencePenalty = presencePenalty;
    this.frequencyPenalty = frequencyPenalty;
    this.bestOf = bestOf;
    this.logitBias = logitBias;
    this.restrictions = verifyInstance(GPTRestrictions, restrictions);
  }
}
