export class CreateComment {
    type: string;
    payload: {
        roomId: string;
        creatorId: string;
        body: string;
        tag: string;
    };

    constructor(roomId: string, creatorId: string, body: string, tag: string = '') {
        this.type = 'CreateComment';
        this.payload = {
            roomId: roomId,
            creatorId: creatorId,
            body: body,
            tag: tag
        };
    }
}
