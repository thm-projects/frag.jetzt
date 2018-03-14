import { AnswerOption } from './answer-option';
import { Content, ContentType } from './content';

export class ChoiceContent extends Content {
  constructor(roomId: string, subject: string, body: string, options: AnswerOption[], correctOptionIndexes: number[], multiple: boolean) {
    super();
    this.revision = '1';
    this.roomId = roomId;
    this.subject = subject;
    this.body = body;
    this.round = 1;
    this.format = ContentType.CHOICE;
    this.options = options;
    this.correctOptionIndexes = correctOptionIndexes;
    this.multiple = multiple;
  }
  options: AnswerOption[];
  correctOptionIndexes: number[];
  multiple: boolean;
}
