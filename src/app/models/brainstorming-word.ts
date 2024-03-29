import { UUID } from 'app/utils/ts-utils';

export class BrainstormingWord {
  id: UUID;
  sessionId: UUID;
  word: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
  banned: boolean;
  categoryId: string;
  correctedWord: string;

  constructor({
    id = null,
    sessionId = null,
    word = '',
    upvotes = 0,
    downvotes = 0,
    createdAt = new Date(),
    updatedAt = null,
    banned = false,
    categoryId = '',
    correctedWord = null,
  }: BrainstormingWord) {
    this.id = id;
    this.sessionId = sessionId;
    this.word = word;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    this.createdAt = createdAt ? new Date(createdAt) : createdAt;
    this.updatedAt = updatedAt ? new Date(updatedAt) : updatedAt;
    this.banned = banned;
    this.categoryId = categoryId;
    this.correctedWord = correctedWord;
  }
}
