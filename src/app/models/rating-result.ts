export class RatingResult {
  rating: number;
  people: number;

  constructor(
    rating: number = 0,
    people: number = 0,
  ) {
    this.rating = rating;
    this.people = people;
  }
}
