import { verifyInstance } from 'app/utils/ts-utils';

export class GPTPlatformStatus {
  restricted: boolean;
  enabled: boolean;
  apiKeyPresent: boolean;

  constructor({
    restricted = true,
    apiKeyPresent = false,
    enabled = false,
  }: GPTPlatformStatus) {
    this.restricted = restricted;
    this.apiKeyPresent = apiKeyPresent;
    this.enabled = enabled;
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
