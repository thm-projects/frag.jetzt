export class RoomDeleted {
  type: string;
  payload: {
    id: string;
  };

  constructor(id: string) {
    this.type = 'RoomDeleted';
    this.payload = {
      id
    };
  }
}
