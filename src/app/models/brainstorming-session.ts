// https://datatracker.ietf.org/doc/html/rfc5646#section-2
type Language = string;

export interface WordVotes {
  [key: string]: {
    upvotes: number;
    downvotes: number;
    ownHasUpvoted: boolean;
  };
}

export class BrainstormingSession {
  id: string;
  roomId: string;
  title: string;
  active: boolean;
  createdAt: Date;
  maxWordLength: number;
  maxWordCount: number;
  votesForWords: WordVotes;
  updatedAt: Date;
  language: Language;
  votingAllowed: boolean;

  constructor(
    roomId: string = '',
    title: string = '',
    active: boolean = true,
    createdAt: Date = null,
    maxWordLength: number = 20,
    maxWordCount: number = 1,
    votesForWords: WordVotes = null,
    language: Language = '',
    votingAllowed: boolean = false,
  ) {
    this.id = '';
    this.roomId = roomId;
    this.title = title;
    this.active = active;
    this.createdAt = createdAt;
    this.maxWordLength = maxWordLength;
    this.maxWordCount = maxWordCount;
    this.votesForWords = votesForWords;
    this.updatedAt = null;
    this.language = language;
    this.votingAllowed = votingAllowed;
  }
}
