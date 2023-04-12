import { Storable, verifyInstance } from 'app/utils/ts-utils';

export class GPTRoomPresetTopic {
  description: string;
  active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTopic) {
    this.description = description;
    this.active = active;
  }
}

export enum GPTRoomAnswerFormat {
  DISABLED = '',
  SUMMARY = 'summary',
  DEFINITION = 'definition',
  FLASHCARD = 'flashcard',
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

  constructor({
    context = '',
    topics = [],
    length = GPTRoomPresetLength.DISABLED,
  }: Storable<GPTRoomPreset>) {
    this.context = context;
    this.topics = topics.map((e) => verifyInstance(GPTRoomPresetTopic, e));
    this.length = length;
  }
}
