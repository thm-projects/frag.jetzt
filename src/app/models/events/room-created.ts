export class RoomCreated {
  type: string;
  payload: {
    id: string;
  };

  constructor(id: string) {
    this.type = 'RoomCreated';
    this.payload = {
      id: id
    };
  }
}
