import { BrainstormingSession } from './brainstorming-session';

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
  conversationBlocked: boolean;
  profanityFilter: ProfanityFilter;
  blacklistIsActive: boolean;
  brainstormingSession: BrainstormingSession;
  tagCloudSettings: string;
  moderatorRoomReference: string;
  createdAt: Date;
  updatedAt: Date;
  lastVisitCreator: Date;

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
    conversationBlocked: boolean = true,
    profanityFilter: ProfanityFilter = ProfanityFilter.NONE,
    blacklistIsActive: boolean = true,
    brainstormingSession: BrainstormingSession = null,
    tagCloudSettings: string = null,
    moderatorRoomReference: string = null,
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
    this.blacklistIsActive = blacklistIsActive;
    this.brainstormingSession = brainstormingSession;
    this.tagCloudSettings = tagCloudSettings;
    this.moderatorRoomReference = moderatorRoomReference;
    this.createdAt = new Date();
    this.updatedAt = null;
    this.lastVisitCreator = new Date();
  }
}

export enum ProfanityFilter {
  ALL = 'ALL',
  LANGUAGE_SPECIFIC = 'LANGUAGE_SPECIFIC',
  PARTIAL_WORDS = 'PARTIAL_WORDS',
  NONE = 'NONE',
  DEACTIVATED = 'DEACTIVATED'
}
