import { UUID, verifyInstance } from 'app/utils/ts-utils';

export class LivepollVote {
  id: UUID;
  accountId: UUID;
  sessionId: UUID;
  voteIndex: number;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    accountId = null,
    sessionId = null,
    voteIndex = -1,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<LivepollVote>) {
    this.id = id;
    this.accountId = accountId;
    this.sessionId = sessionId;
    this.voteIndex = voteIndex;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
