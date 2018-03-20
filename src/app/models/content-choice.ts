import { AnswerOption } from './answer-option';
import { Content } from './content';
import { ContentType } from './content-type.enum';

export class ContentChoice extends Content {
  options: AnswerOption[];
  correctOptionIndexes: number[];
  multiple: boolean;

  constructor(contentId: string,
              revision: string,
              roomId: string,
              subject: string,
              body: string,
              round: number,
              options: AnswerOption[],
              correctOptionIndexes: number[],
              multiple: boolean) {
    super(contentId,
      revision,
      roomId,
      subject,
      body,
      round,
      ContentType.CHOICE,
      new Map());
      this.options = options;
      this.correctOptionIndexes = correctOptionIndexes;
      this.multiple = multiple;
    }
  }
