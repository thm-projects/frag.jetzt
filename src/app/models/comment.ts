import { SpacyKeyword } from '../services/http/spacy.service';
import { CorrectWrong } from './correct-wrong.enum';
import { Model } from '../services/http/spacy.interface';
import { TranslateService } from '@ngx-translate/core';
import { ImmutableStandardDelta, StandardDelta } from '../utils/quill-utils';

export class Comment {
  id: string;
  roomId: string;
  creatorId: string;
  revision: string;
  body: ImmutableStandardDelta;
  read: boolean;
  correct: CorrectWrong;
  favorite: boolean;
  createdAt: Date;
  bookmark: boolean;
  score: number;
  createdFromLecturer: boolean;
  highlighted: boolean;
  ack: boolean;
  tag: string;
  number: string;
  keywordsFromQuestioner: SpacyKeyword[];
  keywordsFromSpacy: SpacyKeyword[];
  upvotes: number;
  downvotes: number;
  language: Language;
  questionerName: string;
  createdBy;
  brainstormingSessionId: string;
  brainstormingWordId: string;
  updatedAt: Date;
  commentReference: string;
  commentDepth: number;
  deletedAt: Date;

  constructor(
    roomId: string = '',
    creatorId: string = '',
    body: StandardDelta = { ops: [] },
    read: boolean = false,
    correct: CorrectWrong = CorrectWrong.NULL,
    favorite: boolean = false,
    creationTimestamp: Date = null,
    bookmark: boolean = false,
    score: number = 0,
    createdFromLecturer = false,
    highlighted: boolean = false,
    ack: boolean = true,
    tag: string = '',
    keywordsFromQuestioner: SpacyKeyword[] = [],
    keywordsFromSpacy: SpacyKeyword[] = [],
    upvotes = 0,
    downvotes = 0,
    language = Language.AUTO,
    questionerName: string = null,
    brainstormingSessionId = null,
    brainstormingWordId = null,
    createdBy: any = undefined,
    commentReference: string = null,
    commentDepth: number = 0
  ) {
    this.id = '';
    this.roomId = roomId;
    this.creatorId = creatorId;
    this.revision = '';
    this.body = body;
    this.read = read;
    this.correct = correct;
    this.favorite = favorite;
    this.bookmark = bookmark;
    this.createdAt = creationTimestamp;
    this.score = score;
    this.createdFromLecturer = createdFromLecturer;
    this.highlighted = highlighted;
    this.ack = ack;
    this.tag = tag;
    this.keywordsFromQuestioner = keywordsFromQuestioner;
    this.keywordsFromSpacy = keywordsFromSpacy;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    this.language = language;
    this.createdBy = createdBy;
    this.questionerName = questionerName;
    this.brainstormingSessionId = brainstormingSessionId;
    this.brainstormingWordId = brainstormingWordId;
    this.updatedAt = null;
    this.commentReference = commentReference;
    this.commentDepth = commentDepth;
  }

  static mapModelToLanguage(model: Model): Language {
    return Language[model.toUpperCase()] || Language.AUTO;
  }

  static computePrettyCommentNumber(translateService: TranslateService, comment: Comment): string[] {
    if (!comment?.number) {
      return [];
    }
    const meta = comment.number.split('/');
    const topLevelNumber = meta[0];
    const number = meta[meta.length - 1];
    let commentNumber: string[] = [];
    if (meta.length === 1) {
      translateService.get('comment-list.question-number', { number })
        .subscribe(msg => commentNumber = msg.split('/'));
      return commentNumber;
    }
    translateService.get('comment-list.comment-number', {
      topLevelNumber,
      number,
      level: meta.length - 1,
    }).subscribe(msg => commentNumber = msg.split('/'));
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

export enum Language {
  DE = 'DE',
  EN = 'EN',
  FR = 'FR',
  ES = 'ES',
  IT = 'IT',
  NL = 'NL',
  PT = 'PT',
  AUTO = 'AUTO'
}

