export class HighlightComment {
  type: string;
  payload: {
    id: string;
    lights: boolean;
  };

  constructor(id: string, lights: boolean) {
    this.type = 'HighlightComment';
    this.payload = {
      id: id,
      lights: lights
    };
  }
}
