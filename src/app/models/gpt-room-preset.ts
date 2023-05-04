import { Storable, verifyInstance } from 'app/utils/ts-utils';

export class GPTRoomPresetTopic {
  description: string;
  active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTopic) {
    this.description = description;
    this.active = active;
  }
}

export enum GPTRoomPresetLength {
  DISABLED = '',
  SHORT = 'short',
  DETAILED = 'detailed',
  EXTENSIVE = 'extensive',
}

export class GPTRoomPreset {
  context: string;
  topics: GPTRoomPresetTopic[];
  length: string;
  disableEnhancedPrompt: boolean;
  disableForwardMessage: boolean;
  roleInstruction: string;

  constructor({
    context = '',
    topics = [],
    length = GPTRoomPresetLength.DISABLED,
    disableEnhancedPrompt = false,
    disableForwardMessage = false,
    roleInstruction = null,
  }: Storable<GPTRoomPreset>) {
    this.context = context;
    this.topics = topics.map((e) => verifyInstance(GPTRoomPresetTopic, e));
    this.length = length;
    this.disableEnhancedPrompt = disableEnhancedPrompt;
    this.disableForwardMessage = disableForwardMessage;
    this.roleInstruction = roleInstruction;
  }
}
