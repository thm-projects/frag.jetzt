export class BonusTokenDeleted {
    type: string;
    payload: {
      token: string;
    };
  
    constructor(token: string) {
      this.type = 'BonusTokenDeleted';
      this.payload = {
        token: token
      };
    }
  }
  