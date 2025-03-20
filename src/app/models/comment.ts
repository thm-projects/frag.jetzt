import { CorrectWrong } from './correct-wrong.enum';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, of } from 'rxjs';
import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';
import {
  Keywords,
  ModerationResult,
} from 'app/room/assistant-route/services/simple-ai.service';

export class Comment {
  id: UUID;
  roomId: UUID;
  creatorId: UUID;
  number: string;
  ack: boolean;
  body: string;
  correct: CorrectWrong;
  favorite: boolean;
  read: boolean;
  tag: string;
  createdAt: Date;
  bookmark: boolean;
  keywords: Keywords;
  moderationData: ModerationResult;
  score: number;
  upvotes: number;
  downvotes: number;
  questionerName: string;
  updatedAt: Date;
  commentReference: UUID;
  deletedAt: Date;
  commentDepth: number;
  brainstormingSessionId: UUID;
  brainstormingWordId: UUID;
  approved: boolean;
  gptWriterState: number;
  topic: string;

  constructor({
    id = null,
    roomId = null,
    creatorId = null,
    number = '?',
    ack = false,
    body = '',
    correct = CorrectWrong.NULL,
    favorite = false,
    read = false,
    tag = null,
    createdAt = new Date(),
    bookmark = false,
    keywords = null,
    moderationData = null,
    score = 0,
    upvotes = 0,
    downvotes = 0,
    questionerName = null,
    updatedAt = null,
    commentReference = null,
    deletedAt = null,
    commentDepth = 0,
    brainstormingSessionId = null,
    brainstormingWordId = null,
    approved = false,
    gptWriterState = 0,
    topic = null,
  }: Partial<FieldsOf<Comment>>) {
    this.id = id;
    this.roomId = roomId;
    this.creatorId = creatorId;
    this.number = number;
    this.ack = ack;
    this.body = body;
    this.correct = correct;
    this.favorite = favorite;
    this.read = read;
    this.tag = tag;
    this.createdAt = verifyInstance(Date, createdAt);
    this.bookmark = bookmark;
    this.keywords = keywords;
    this.moderationData = moderationData;
    this.score = score;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    this.questionerName = questionerName;
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.commentReference = commentReference;
    this.deletedAt = verifyInstance(Date, deletedAt);
    this.commentDepth = commentDepth;
    this.brainstormingSessionId = brainstormingSessionId;
    this.brainstormingWordId = brainstormingWordId;
    this.approved = approved;
    this.gptWriterState = gptWriterState;
    this.topic = topic;
  }

  static getPrettyCommentNumber(
    translateService: TranslateService,
    comment: Comment,
  ): Observable<string[]> {
    if (!comment?.number) {
      return of([]);
    }
    const meta = comment.number.split('/');
    const topLevelNumber = meta[0];
    const number = meta[meta.length - 1];
    if (meta.length === 1) {
      const str = comment.brainstormingWordId
        ? 'brainstorming-number'
        : 'question-number';
      return translateService
        .get('comment-list.' + str, { number })
        .pipe(map((msg) => msg.split('/')));
    }
    return translateService
      .get('comment-list.comment-number', {
        topLevelNumber,
        number,
        level: meta.length - 1,
      })
      .pipe(map((msg) => msg.split('/')));
  }

  static computePrettyCommentNumber(
    translateService: TranslateService,
    comment: Comment,
  ): string[] {
    if (!comment?.number) {
      return [];
    }
    const meta = comment.number.split('/');
    const topLevelNumber = meta[0];
    const number = meta[meta.length - 1];
    let commentNumber: string[] = [];
    if (meta.length === 1) {
      translateService
        .get('comment-list.question-number', { number })
        .subscribe((msg) => (commentNumber = msg.split('/')));
      return commentNumber;
    }
    translateService
      .get('comment-list.comment-number', {
        topLevelNumber,
        number,
        level: meta.length - 1,
      })
      .subscribe((msg) => (commentNumber = msg.split('/')));
    return commentNumber;
  }
}

export const numberSorter = (a: string, b: string) => {
  const arrA = a.split('/');
  const arrB = b.split('/');
  const minLen = Math.min(arrA.length, arrB.length);
  for (let i = 0, equals = 0; i < minLen; i++) {
    equals = Number(arrB[i]) - Number(arrA[i]);
    if (equals !== 0) {
      return equals;
    }
  }
  return arrB.length - arrA.length;
};
