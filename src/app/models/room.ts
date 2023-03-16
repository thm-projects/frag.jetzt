import { BrainstormingSession } from './brainstorming-session';
import { ImmutableStandardDelta } from '../utils/quill-utils';
import { UUID, verifyInstance } from 'app/utils/ts-utils';
import { LivepollSession } from './livepoll-session';

export class Room {
  id: UUID;
  ownerId: UUID;
  shortId: string;
  name: string;
  description: ImmutableStandardDelta;
  closed: boolean;
  bonusArchiveActive: boolean;
  directSend: boolean;
  threshold: number;
  questionsBlocked: boolean;
  blacklist: string;
  profanityFilter: ProfanityFilter;
  blacklistActive: boolean;
  tagCloudSettings: string;
  moderatorRoomReference: UUID;
  createdAt: Date;
  updatedAt: Date;
  lastVisitCreator: Date;
  conversationDepth: number;
  quizActive: boolean;
  brainstormingActive: boolean;
  language: string;
  livepollActive: boolean;
  // transient fields
  tags: string[];
  brainstormingSession: BrainstormingSession;
  livepollSession: LivepollSession;

  constructor({
    id = null,
    ownerId = null,
    shortId = null,
    name = null,
    description = { ops: [] },
    closed = false,
    bonusArchiveActive = false,
    directSend = false,
    threshold = 0,
    questionsBlocked = false,
    blacklist = '[]',
    profanityFilter = ProfanityFilter.NONE,
    blacklistActive = false,
    tagCloudSettings = null,
    moderatorRoomReference = null,
    createdAt = new Date(),
    updatedAt = null,
    lastVisitCreator = null,
    conversationDepth = 7,
    quizActive = false,
    brainstormingActive = false,
    language = null,
    livepollActive = true,
    // transient fields
    tags = [],
    brainstormingSession = null,
    livepollSession = null,
  }: Partial<Room>) {
    this.id = id;
    this.ownerId = ownerId;
    this.shortId = shortId;
    this.name = name;
    this.description = description;
    this.closed = closed;
    this.bonusArchiveActive = bonusArchiveActive;
    this.directSend = directSend;
    this.threshold = threshold;
    this.questionsBlocked = questionsBlocked;
    this.blacklist = blacklist;
    this.profanityFilter = profanityFilter;
    this.blacklistActive = blacklistActive;
    this.brainstormingSession = brainstormingSession;
    this.tagCloudSettings = tagCloudSettings;
    this.moderatorRoomReference = moderatorRoomReference;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
    this.lastVisitCreator = verifyInstance(Date, lastVisitCreator);
    this.conversationDepth = conversationDepth;
    this.quizActive = quizActive;
    this.brainstormingActive = brainstormingActive;
    this.language = language;
    this.livepollActive = livepollActive;
    this.tags = [...tags];
    this.brainstormingSession = verifyInstance(
      BrainstormingSession,
      brainstormingSession,
    );
    this.livepollSession = verifyInstance(LivepollSession, livepollSession);
  }
}

export enum ProfanityFilter {
  ALL = 'ALL',
  LANGUAGE_SPECIFIC = 'LANGUAGE_SPECIFIC',
  PARTIAL_WORDS = 'PARTIAL_WORDS',
  NONE = 'NONE',
  DEACTIVATED = 'DEACTIVATED',
}
