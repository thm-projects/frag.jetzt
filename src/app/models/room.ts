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
  questionsBlocked: boolean;
  profanityFilter: boolean;
  censorPartialWords: boolean;
  censorLanguageSpecific: boolean;


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
    questionsBlocked: boolean = false,
    profanityFilter: boolean = true,
    censorPartialWords: boolean = false,
    censorLanguageSpecific: boolean = false
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
    this.questionsBlocked = questionsBlocked;
    this.profanityFilter = profanityFilter;
    this.censorPartialWords = censorPartialWords;
    this.censorLanguageSpecific = censorLanguageSpecific;
  }
}
