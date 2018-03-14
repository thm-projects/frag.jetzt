import { Content, ContentType } from './content';

export class TextContent extends Content {

  constructor(roomId: string, subject: string, body: string) {
    super();
    this.revision = '1';
    this.roomId = roomId;
    this.subject = subject;
    this.body = body;
    this.round = 1;
    this.format = ContentType.TEXT;
    this.formatAttributes.clear(); // API: formatAttributes = Map.empty();
  }
}
