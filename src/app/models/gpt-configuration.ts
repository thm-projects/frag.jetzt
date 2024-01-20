import { FieldsOf, verifyInstance } from 'app/utils/ts-utils';

export class GPTQuotaUnit {
  value: number;
  exponent: number;

  constructor({ value = 0, exponent = 0 }: FieldsOf<GPTQuotaUnit>) {
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

export class GPTRestrictions {
  active: boolean;
  globalActive: boolean;
  globalAccumulatedQuota: number;
  endDate: Date;

  constructor({
    active = false,
    globalActive = false,
    globalAccumulatedQuota = 500,
    endDate = new Date(),
  }) {
    this.active = active;
    this.globalActive = globalActive;
    this.globalAccumulatedQuota = globalAccumulatedQuota;
    this.endDate = verifyInstance(Date, endDate);
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
