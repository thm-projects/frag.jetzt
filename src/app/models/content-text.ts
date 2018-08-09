import { Content } from './content';
import { ContentType } from './content-type.enum';

export class ContentText extends Content {

  constructor(contentId: string,
              revision: string,
              roomId: string,
              subject: string,
              body: string,
              round: number,
              groups: string[]) {
    super(contentId,
      revision,
      roomId,
      subject,
      body,
      round,
      groups,
      ContentType.TEXT,
      new Map());
  }
}
