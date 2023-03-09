import { verifyInstance } from 'app/utils/ts-utils';

export class GPTRoomPresetTopic {
  description: string;
  active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTopic) {
    this.description = description;
    this.active = active;
  }
}

export class GPTRoomPresetTone {
  description: string;
  active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTone) {
    this.description = description;
    this.active = active;
  }
}

export class GPTRoomPreset {
  context: string;
  personaCreator: string;
  personaModerator: string;
  personaParticipant: string;
  topics: GPTRoomPresetTopic[];
  language: string;
  tones: GPTRoomPresetTone[];
  formal: boolean | null;
  length: string;

  constructor({
    context = '',
    personaCreator = '',
    personaModerator = '',
    personaParticipant = '',
    topics = [],
    language = '',
    tones = [],
    formal = null,
    length = '',
  }: GPTRoomPreset) {
    this.context = context;
    this.personaCreator = personaCreator;
    this.personaModerator = personaModerator;
    this.personaParticipant = personaParticipant;
    this.topics = topics.map((e) => verifyInstance(GPTRoomPresetTopic, e));
    this.language = language;
    this.tones = tones.map((e) => verifyInstance(GPTRoomPresetTone, e));
    this.formal = formal;
    this.length = length;
  }
}
