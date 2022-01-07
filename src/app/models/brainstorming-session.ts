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
  started: Date;
  maxWordLength: number;
  maxWordCount: number;
  votesForWords: WordVotes;

  constructor(roomId: string = '',
              title: string = '',
              active: boolean = true,
              started: Date = null,
              maxWordLength: number = 20,
              maxWordCount: number = 1,
              votesForWords: WordVotes = null) {
    this.id = '';
    this.roomId = roomId;
    this.title = title;
    this.active = active;
    this.started = started;
    this.maxWordLength = maxWordLength;
    this.maxWordCount = maxWordCount;
    this.votesForWords = votesForWords;
  }

}
