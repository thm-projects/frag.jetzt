export class Rating {
  id: string;
  userId: string;
  rating: number;

  constructor(
    userId: string = '',
    rating: number = 0,
  ) {
    this.id = null;
    this.userId = userId;
    this.rating = rating;
  }

}
