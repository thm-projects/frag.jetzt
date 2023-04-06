import { Storable, verifyInstance } from 'app/utils/ts-utils';

export class GPTQuotaUnit {
  value: number;
  exponent: number;

  constructor({ value = 0, exponent = 0 }: Storable<GPTQuotaUnit>) {
    this.value = value;
    this.exponent = exponent;
  }

  toPlain(exponent: number): number {
    if (this.value == null) {
      return null;
    }
    return Math.trunc(this.value * Math.pow(10, exponent - this.exponent));
  }

  toFixed(exponent: number, digits = Number.MAX_VALUE): string {
    if (this.value == null) {
      return null;
    }
    return (this.value * Math.pow(10, exponent - this.exponent)).toFixed(
      digits,
    );
  }
}

export class GPTActivationCode {
  code: string;
  maximalCost: GPTQuotaUnit;
  costCounter: GPTQuotaUnit;
  activatedRoomId: string;

  constructor({
    code = null,
    maximalCost = null,
    costCounter = null,
    activatedRoomId = null,
  }) {
    this.code = code;
    this.maximalCost = verifyInstance(GPTQuotaUnit, maximalCost);
    this.costCounter = verifyInstance(GPTQuotaUnit, costCounter);
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
