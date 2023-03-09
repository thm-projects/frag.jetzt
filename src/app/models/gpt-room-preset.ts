import { verifyInstance } from 'app/utils/ts-utils';

export class GPTRoomPresetTopic {
  private description: string;
  private active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTopic) {
    this.description = description;
    this.active = active;
  }
}

export enum GPTRoomPresetLanguage {
  DISABLED = '',
  GERMAN = 'de',
  ENGLISH = 'en',
  FRENCH = 'fr',
  LIKE_QUESTION = 'like_question',
}

export class GPTRoomPresetTone {
  private description: string;
  private active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetTone) {
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
  private context: string;
  private personaCreator: string;
  private personaModerator: string;
  private personaParticipant: string;
  private topics: GPTRoomPresetTopic[];
  private language: GPTRoomPresetLanguage;
  private tones: GPTRoomPresetTone[];
  private formal: boolean | null;
  private length: GPTRoomPresetLength;

  constructor({
    context = '',
    personaCreator = '',
    personaModerator = '',
    personaParticipant = '',
    topics = [],
    language = GPTRoomPresetLanguage.DISABLED,
    tones = [],
    formal = null,
    length = GPTRoomPresetLength.DISABLED,
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
