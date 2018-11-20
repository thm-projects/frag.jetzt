import { ContentType } from './content-type.enum';

export class AnswerChoice {
  id: string;
  revision: string;
  contentId: string;
  round: number;
  selectedChoiceIndexes: number[];
  creationTimestamp: Date;
  format: ContentType;
}
