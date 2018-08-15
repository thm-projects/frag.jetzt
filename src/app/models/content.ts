import { ContentType } from './content-type.enum';

export class Content {
  id: string;
  revision: string;
  roomId: string;
  subject: string;
  body: string;
  round: number;
  groups: string[];
  format: ContentType;
  formatAttributes: Map<string, string>;

  constructor(id: string,
              revision: string,
              roomId: string,
              subject: string,
              body: string,
              round: number,
              groups: string[],
              format: ContentType,
              formatAttributes: Map<string, string>) {
    this.id = id;
    this.revision = revision;
    this.roomId = roomId;
    this.subject = subject;
    this.body = body;
    this.round = round;
    this.groups = groups;
    this.format = format;
    this.formatAttributes = formatAttributes;
  }
}
