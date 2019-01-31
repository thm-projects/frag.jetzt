export class CreateFeedback {
  type: string;
  payload: {
    value: number;
  };

  constructor(val: number) {
    this.type = 'CreateFeedback';
    this.payload = {
      value: val
    };
  }
}
