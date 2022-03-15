import { Room } from './room';

export class Notification{

    constructor(
        private date: Date,
        private room: Room,
        private question: Comment
        ) {}

}
