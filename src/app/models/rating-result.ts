export class RatingResult {
  rating: number;
  fiveStarPercent: number;
  fourStarPercent: number;
  threeStarPercent: number;
  twoStarPercent: number;
  oneStarPercent: number;
  people: number;

  constructor(
    rating: number = 0,
    fiveStarPercent: number = 0,
    fourStarPercent: number = 0,
    threeStarPercent: number = 0,
    twoStarPercent: number = 0,
    oneStarPercent: number = 0,
    people: number = 0,
  ) {
    this.rating = rating;
    this.fiveStarPercent = fiveStarPercent;
    this.fourStarPercent = fourStarPercent;
    this.threeStarPercent = threeStarPercent;
    this.twoStarPercent = twoStarPercent;
    this.oneStarPercent = oneStarPercent;
    this.people = people;
  }
}
