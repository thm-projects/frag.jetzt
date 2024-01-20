import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import { GPTAPIKey } from 'app/services/http/gptapisetting.service';
import { GPTVoucher } from 'app/services/http/gptvoucher.service';

export class GPTRoomKey {
  id: UUID;
  settingId: UUID;
  apiSettingId: UUID | null;
  voucherId: UUID | null;
  index: number;
  createdAt: Date;
  updatedAt: Date | null;
  // additional transient
  apiSetting: GPTAPIKey | null;
  voucher: GPTVoucher | null;

  constructor({
    id = null,
    settingId = null,
    apiSettingId = null,
    voucherId = null,
    index = 0,
    createdAt = new Date(),
    updatedAt = null,
    apiSetting = null,
    voucher = null,
  }: Partial<FieldsOf<GPTRoomKey>>) {
    this.id = id;
    this.settingId = settingId;
    this.apiSettingId = apiSettingId;
    this.voucherId = voucherId;
    this.index = index;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.apiSetting = verifyInstance(GPTAPIKey, apiSetting);
    this.voucher = verifyInstance(GPTVoucher, voucher);
  }
}

export class GPTRoomModel {
  id: UUID;
  settingId: UUID;
  name: string;
  index: number;
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = null,
    settingId = null,
    name = '',
    index = 0,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<FieldsOf<GPTRoomModel>>) {
    this.id = id;
    this.settingId = settingId;
    this.name = name;
    this.index = index;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export class GPTRoomSetting {
  id: string;
  roomId: string;
  // quota
  roomQuotaId: UUID | null;
  participantQuotaId: UUID | null;
  moderatorQuotaId: UUID | null;
  // rights
  rightsBitset: number;
  // payment
  paymentCounter: number;
  // presets
  presetContext: string;
  presetLength: string;
  roleInstruction: string;
  defaultModel: string | null;
  // meta information
  createdAt: Date;
  updatedAt: Date | null;
  // additional transient
  apiKeys: GPTRoomKey[];
  apiModels: GPTRoomModel[];

  constructor({
    id = null,
    roomId = null,
    roomQuotaId = null,
    participantQuotaId = null,
    moderatorQuotaId = null,
    rightsBitset = 0,
    paymentCounter = 0,
    presetContext = '',
    presetLength = '',
    roleInstruction = '',
    defaultModel = null,
    createdAt = new Date(),
    updatedAt = null,
    apiKeys = [],
    apiModels = [],
  }: Partial<FieldsOf<GPTRoomSetting>>) {
    this.id = id;
    this.roomId = roomId;
    this.roomQuotaId = roomQuotaId;
    this.participantQuotaId = participantQuotaId;
    this.moderatorQuotaId = moderatorQuotaId;
    this.rightsBitset = rightsBitset;
    this.paymentCounter = paymentCounter;
    this.presetContext = presetContext;
    this.presetLength = presetLength;
    this.roleInstruction = roleInstruction;
    this.defaultModel = defaultModel;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.apiKeys = apiKeys.map((apiKey) => verifyInstance(GPTRoomKey, apiKey));
    this.apiModels = apiModels.map((apiModel) =>
      verifyInstance(GPTRoomModel, apiModel),
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

  disableEnhancedPrompt(): boolean {
    return ((this.rightsBitset >>> 7) & 1) > 0;
  }

  disableForwardMessage(): boolean {
    return ((this.rightsBitset >>> 8) & 1) > 0;
  }
}
