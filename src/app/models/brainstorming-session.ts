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

  constructor(roomId: string = '',
              title: string = '',
              active: boolean = true,
              createdAt: Date = null,
              maxWordLength: number = 20,
              maxWordCount: number = 1,
              votesForWords: WordVotes = null) {
    this.id = '';
    this.roomId = roomId;
    this.title = title;
    this.active = active;
    this.createdAt = createdAt;
    this.maxWordLength = maxWordLength;
    this.maxWordCount = maxWordCount;
    this.votesForWords = votesForWords;
    this.updatedAt = null;
  }

}
