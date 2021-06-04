import { TSMap } from 'typescript-map';

export class Room {
  id: string;
  revision: string;
  ownerId: string;
  shortId: string;
  abbreviation: string;
  name: string;
  description: string;
  blacklist: string;
  closed: boolean;
  moderated: boolean;
  directSend: boolean;
  threshold: number;
  tags: string[];

  constructor(
    ownerId: string = '',
    shortId: string = '',
    abbreviation: string = '',
    name: string = '',
    description: string = '',
    blacklist: string = '[]',
    closed: boolean = false,
    moderated: boolean = true,
    directSend: boolean = true,
    threshold: number = null,
    tags: string[] = [],
  ) {
    this.id = '';
    this.ownerId = ownerId;
    this.shortId = shortId;
    this.abbreviation = abbreviation;
    this.name = name;
    this.description = description;
    this.blacklist = blacklist;
    this.closed = closed;
    this.moderated = moderated;
    this.directSend = directSend;
    this.threshold = threshold;
    this.tags = tags;
  }
}
