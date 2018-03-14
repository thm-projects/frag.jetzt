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

  constructor(contentId: string,
              revision: string,
              roomId: string,
              subject: string,
              body: string,
              round: number,
              format: ContentType,
              formatAttributes: Map<string, string>) {
    this.contentId = contentId;
    this.revision = revision;
    this.roomId = roomId;
    this.subject = subject;
    this.body = body;
    this.round = round;
    this.format = format;
    this.formatAttributes = formatAttributes;
  }
}
