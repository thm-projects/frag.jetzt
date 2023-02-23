import { verifyInstance } from 'app/utils/ts-utils';

export enum GPTUsage {
  REGISTERED_MODERATORS = 'REGISTERED_MODERATORS',
  REGISTERED_USERS = 'REGISTERED_USERS',
}

export class GPTPlatformStatus {
  restricted: boolean;
  apiKeyPresent: boolean;
  modelPresent: boolean;
  usage: GPTUsage;
  // suggestion
  defaultMaxTokens?: number;
  contextTokens: number;
  availableTokens: number;

  constructor({
    restricted = true,
    apiKeyPresent = false,
    modelPresent = false,
    usage = GPTUsage.REGISTERED_MODERATORS,
    defaultMaxTokens = null,
    contextTokens = 2048,
    availableTokens = 0,
  }: GPTPlatformStatus) {
    this.restricted = restricted;
    this.apiKeyPresent = apiKeyPresent;
    this.modelPresent = modelPresent;
    this.usage = usage;
    this.defaultMaxTokens = defaultMaxTokens;
    this.contextTokens = contextTokens;
    this.availableTokens = availableTokens;
  }
}

export class GPTRoomStatus {
  restricted: boolean;
  hasAPI: boolean;
  availableTokens: number;
  platformStatus: GPTPlatformStatus;

  constructor({
    restricted = true,
    hasAPI = false,
    availableTokens = 0,
    platformStatus = null,
  }: GPTRoomStatus) {
    this.restricted = restricted;
    this.hasAPI = hasAPI;
    this.availableTokens = availableTokens;
    this.platformStatus = verifyInstance(GPTPlatformStatus, platformStatus);
  }
}
