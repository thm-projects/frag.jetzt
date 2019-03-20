export class PatchComment {
  type: string;
  payload: {
      roomId: string;
      creatorId: string;
      body: string;
  };

  constructor(roomId: string, creatorId: string, body: string) {
      this.type = 'CreateComment';
      this.payload = {
          roomId: roomId,
          creatorId: creatorId,
          body: body
      };
  }
}
