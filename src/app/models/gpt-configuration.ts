import { verifyInstance } from 'app/utils/ts-utils';

export class GPTActivationCode {
  code: string;
  maximalCost: number; // 20,00 $ -> 2000
  costCounter: number;
  activatedRoomId: string;

  constructor({
    code = null,
    maximalCost = 0,
    costCounter = 0,
    activatedRoomId = null,
  }) {
    this.code = code;
    this.maximalCost = maximalCost;
    this.costCounter = costCounter;
    this.activatedRoomId = activatedRoomId;
  }
}

export class GPTRestrictions {
  active: boolean;
  endDate: Date;
  platformCodes: GPTActivationCode[];

  constructor({ active = false, endDate = new Date(), platformCodes = [] }) {
    this.active = active;
    this.endDate = verifyInstance(Date, endDate);
    this.platformCodes = platformCodes.map((e) =>
      verifyInstance(GPTActivationCode, e),
    );
  }
}

export class GPTConfiguration {
  apiKey: string;
  organization: string;
  restrictions: GPTRestrictions;

  constructor({
    apiKey = null,
    organization = null,
    restrictions = null,
  }: GPTConfiguration) {
    this.apiKey = apiKey;
    this.organization = organization;
    this.restrictions = verifyInstance(GPTRestrictions, restrictions);
  }
}
