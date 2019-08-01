export class RoomJoined {
  type: string;
  payload: {
    id: string;
  };

  constructor(id: string) {
    this.type = 'RoomJoined';
    this.payload = {
      id: id
    };
  }
}
