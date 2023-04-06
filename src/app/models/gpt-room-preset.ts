import { verifyInstance } from 'app/utils/ts-utils';

export class GPTRoomPresetTopic {
  description: string;
  active: boolean;

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

export enum GPTRoomPresetTone {
  DISABLED = '',
  NEUTRAL = 'neutral',
  FRIENDLY = 'friendly',
  PROFESSIONAL = 'professional',
  HUMOROUS = 'humorous',
}

export enum GPTRoomAnswerFormat {
  DISABLED = '',
  SUMMARY = 'summary',
  DEFINITION = 'definition',
  FLASHCARD = 'flashcard',
}

export class GPTRoomPresetToneDTO {
  description: string;
  active: boolean;

  constructor({ description = null, active = true }: GPTRoomPresetToneDTO) {
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
  personaCreator: string;
  personaModerator: string;
  personaParticipant: string;
  topics: GPTRoomPresetTopic[];
  language: string;
  tones: GPTRoomPresetToneDTO[];
  formal: boolean | null;
  length: string;

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
    this.tones = tones.map((e) => verifyInstance(GPTRoomPresetToneDTO, e));
    this.formal = formal;
    this.length = length;
  }
}
