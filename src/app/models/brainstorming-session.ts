import { UUID } from 'app/utils/ts-utils';
import { BrainstormingWord } from './brainstorming-word';

// https://datatracker.ietf.org/doc/html/rfc5646#section-2
type Language = string;

export interface WordsWithMeta {
  [key: string]: {
    word: BrainstormingWord;
    ownHasUpvoted: boolean;
  };
}

export class BrainstormingSession {
  id: UUID;
  roomId: UUID;
  title: string;
  active: boolean;
  createdAt: Date;
  maxWordLength: number;
  maxWordCount: number;
  wordsWithMeta: WordsWithMeta;
  updatedAt: Date;
  language: Language;
  ratingAllowed: boolean;
  ideasFrozen: boolean;
  ideasTimeDuration: number;
  ideasEndTimestamp: Date;

  constructor({
    id = null,
    roomId = null,
    title = '',
    active = true,
    createdAt = null,
    maxWordLength = 20,
    maxWordCount = 1,
    wordsWithMeta = {},
    language = '',
    ratingAllowed = false,
    ideasFrozen = true,
    ideasTimeDuration = null,
    ideasEndTimestamp = null,
    updatedAt = null,
  }: BrainstormingSession) {
    this.id = id;
    this.roomId = roomId;
    this.title = title;
    this.active = active;
    this.createdAt = createdAt;
    this.maxWordLength = maxWordLength;
    this.maxWordCount = maxWordCount;
    this.wordsWithMeta = {};
    if (wordsWithMeta) {
      Object.keys(wordsWithMeta).forEach((key) => {
        const entry = wordsWithMeta[key];
        entry.word = new BrainstormingWord(entry.word);
        this.wordsWithMeta[key] = entry;
      });
    }
    this.language = language;
    this.ratingAllowed = ratingAllowed;
    this.ideasFrozen = ideasFrozen;
    this.ideasTimeDuration = ideasTimeDuration;
    this.ideasEndTimestamp = ideasEndTimestamp;
    this.updatedAt = updatedAt;
  }
}
