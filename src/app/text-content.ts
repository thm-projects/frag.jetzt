import { Content } from './content';
import { ContentType } from './content-type';

export class TextContent extends Content {

  constructor(contentId: string,
              revision: string,
              roomId: string,
              subject: string,
              body: string,
              round: number) {
    super(contentId,
      revision,
      roomId,
      subject,
      body,
      round,
      ContentType.TEXT,
      new Map());
  }
}
