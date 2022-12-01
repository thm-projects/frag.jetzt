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
  id: string;
  roomId: string;
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

  constructor(
    roomId: string = '',
    title: string = '',
    active: boolean = true,
    createdAt: Date = null,
    maxWordLength: number = 20,
    maxWordCount: number = 1,
    wordsWithMeta: WordsWithMeta = null,
    language: string = '',
    ratingAllowed: boolean = false,
    ideasFrozen: boolean = true,
    ideasTimeDuration: number = null,
    ideasEndTimestamp: Date = null,
  ) {
    this.id = '';
    this.roomId = roomId;
    this.title = title;
    this.active = active;
    this.createdAt = createdAt;
    this.maxWordLength = maxWordLength;
    this.maxWordCount = maxWordCount;
    this.wordsWithMeta = wordsWithMeta;
    this.updatedAt = null;
    this.language = language;
    this.ratingAllowed = ratingAllowed;
    this.ideasFrozen = ideasFrozen;
    this.ideasTimeDuration = ideasTimeDuration;
    this.ideasEndTimestamp = ideasEndTimestamp;
  }
}
