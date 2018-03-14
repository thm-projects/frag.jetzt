import { ContentType } from './content-type';

export class Content {
  contentId: string;
  revision: string;
  roomId: string;
  subject: string;
  body: string;
  round: number;
  format: ContentType;
  formatAttributes: Map<string, string>;
}
