import { ContentType } from './content-type.enum';

export class AnswerText {
  id: string;
  revision: string;
  contentId: string;
  round: number;
  subject: string;
  body: string;
  read: string;
  creationTimestamp: Date;
  format: ContentType;
}
