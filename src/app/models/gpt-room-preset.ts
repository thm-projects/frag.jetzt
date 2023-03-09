import { verifyInstance } from 'app/utils/ts-utils';

export class GPTRoomPresetTopic {
  private description: string;
  private active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTopic) {
    this.description = description;
    this.active = active;
  }
}

export class GPTRoomPresetTone {
  private description: string;
  private active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTone) {
    this.description = description;
    this.active = active;
  }
}

export class GPTRoomPreset {
  private context: string;
  private personaCreator: string;
  private personaModerator: string;
  private personaParticipant: string;
  private topics: GPTRoomPresetTopic[];
  private language: string;
  private tones: GPTRoomPresetTone[];
  private formal: boolean | null;
  private length: string;

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
