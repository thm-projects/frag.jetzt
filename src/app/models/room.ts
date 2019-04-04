import { ContentGroup } from './content-group';

export class Room {
  id: string;
  revision: string;
  shortId: string;
  abbreviation: string;
  name: string;
  description: string;
  closed: boolean;
  commentThreshold: number;
  contentGroups: ContentGroup[];
}
