import { ContentGroup } from './content-group';
import { TSMap } from 'typescript-map';

export class Room {
  id: string;
  revision: string;
  ownerId: string;
  shortId: string;
  abbreviation: string;
  name: string;
  description: string;
  closed: boolean;
  contentGroups: ContentGroup[];
  extensions: TSMap<string, TSMap<string, any>>;

  constructor(
    ownerId: string = '',
    shortId: string = '',
    abbreviation: string = '',
    name: string = '',
    description: string = '',
    closed: boolean = false,
    contentGroups: ContentGroup[] = [],
    extensions: TSMap<string, TSMap<string, any>> = new TSMap()
  ) {
    this.id = '',
    this.ownerId = ownerId;
    this.shortId = shortId;
    this.abbreviation = abbreviation;
    this.name = name,
    this.description = description;
    this.closed = closed;
    this.contentGroups = contentGroups;
    this.extensions = extensions;
  }
}
