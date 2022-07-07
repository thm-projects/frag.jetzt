import { BrainstormingSession } from './brainstorming-session';
import { ImmutableStandardDelta } from '../utils/quill-utils';

export class Room {
  id: string;
  ownerId: string;
  shortId: string;
  abbreviation: string;
  name: string;
  description: ImmutableStandardDelta;
  blacklist: string;
  closed: boolean;
  directSend: boolean;
  threshold: number;
  tags: string[];
  questionsBlocked: boolean;
  profanityFilter: ProfanityFilter;
  blacklistActive: boolean;
  brainstormingSession: BrainstormingSession;
  tagCloudSettings: string;
  moderatorRoomReference: string;
  conversationDepth: number;
  createdAt: Date;
  updatedAt: Date;
  lastVisitCreator: Date;
  bonusArchiveActive: boolean;
  quizActive: boolean;
  brainstormingActive: boolean;

  constructor(
    ownerId: string = '',
    shortId: string = '',
    abbreviation: string = '',
    name: string = '',
    description: ImmutableStandardDelta = { ops: [] },
    blacklist: string = '[]',
    closed: boolean = false,
    directSend: boolean = true,
    threshold: number = null,
    tags: string[] = [],
    questionsBlocked: boolean = false,
    profanityFilter: ProfanityFilter = ProfanityFilter.NONE,
    blacklistActive: boolean = true,
    brainstormingSession: BrainstormingSession = null,
    tagCloudSettings: string = null,
    moderatorRoomReference: string = null,
    conversationDepth: number = 0,
    bonusArchiveActive: boolean = true,
    quizActive: boolean = true,
    brainstormingActive: boolean = true
  ) {
    this.id = '';
    this.ownerId = ownerId;
    this.shortId = shortId;
    this.abbreviation = abbreviation;
    this.name = name;
    this.description = description;
    this.blacklist = blacklist;
    this.closed = closed;
    this.directSend = directSend;
    this.threshold = threshold;
    this.tags = tags;
    this.questionsBlocked = questionsBlocked;
    this.profanityFilter = profanityFilter;
    this.blacklistActive = blacklistActive;
    this.brainstormingSession = brainstormingSession;
    this.tagCloudSettings = tagCloudSettings;
    this.moderatorRoomReference = moderatorRoomReference;
    this.createdAt = new Date();
    this.updatedAt = null;
    this.lastVisitCreator = new Date();
    this.conversationDepth = conversationDepth;
    this.bonusArchiveActive = bonusArchiveActive;
    this.quizActive = quizActive;
    this.brainstormingActive = brainstormingActive;
  }
}

export enum ProfanityFilter {
  ALL = 'ALL',
  LANGUAGE_SPECIFIC = 'LANGUAGE_SPECIFIC',
  PARTIAL_WORDS = 'PARTIAL_WORDS',
  NONE = 'NONE',
  DEACTIVATED = 'DEACTIVATED'
}
