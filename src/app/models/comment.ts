import { SpacyKeyword } from '../services/http/spacy.service';
import { CorrectWrong } from './correct-wrong.enum';
import { Model } from '../services/http/spacy.interface';

export class Comment {
  id: string;
  roomId: string;
  creatorId: string;
  revision: string;
  body: string;
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
  answer: string;
  number: number;
  keywordsFromQuestioner: SpacyKeyword[];
  keywordsFromSpacy: SpacyKeyword[];
  upvotes: number;
  downvotes: number;
  language: Language;
  questionerName: string;
  createdBy;
  brainstormingQuestion: boolean;
  answerQuestionerKeywords: SpacyKeyword[];
  answerFulltextKeywords: SpacyKeyword[];
  updatedAt: Date;
  meta: any = null;

  constructor(roomId: string = '',
              creatorId: string = '',
              body: string = '',
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
              answer: string = '',
              keywordsFromQuestioner: SpacyKeyword[] = [],
              keywordsFromSpacy: SpacyKeyword[] = [],
              upvotes = 0,
              downvotes = 0,
              language = Language.AUTO,
              questionerName: string = null,
              brainstormingQuestion = false,
              answerQuestionerKeywords: SpacyKeyword[] = [],
              answerFulltextKeywords: SpacyKeyword[] = [],
              createdBy?: any) {
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
    this.answer = answer;
    this.keywordsFromQuestioner = keywordsFromQuestioner;
    this.keywordsFromSpacy = keywordsFromSpacy;
    this.upvotes = upvotes;
    this.downvotes = downvotes;
    this.language = language;
    this.createdBy = createdBy;
    this.questionerName = questionerName;
    this.brainstormingQuestion = brainstormingQuestion;
    this.answerFulltextKeywords = answerFulltextKeywords;
    this.answerQuestionerKeywords = answerQuestionerKeywords;
    this.updatedAt = null;
  }

  static mapModelToLanguage(model: Model): Language {
    return Language[model] || Language.AUTO;
  }
}

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

