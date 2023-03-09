import { verifyInstance } from 'app/utils/ts-utils';

export class GPTRating {
  id: string;
  accountId: string;
  rating: number;
  ratingText: string;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    accountId = null,
    rating = 0,
    ratingText = null,
    createdAt = new Date(),
    updatedAt = null,
  }: GPTRating) {
    this.id = id;
    this.accountId = accountId;
    this.rating = rating;
    this.ratingText = ratingText;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
