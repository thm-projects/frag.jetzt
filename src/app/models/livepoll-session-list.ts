import { Livepoll } from './livepoll';

export class LivepollSessionList {
  constructor(
    public polls: Livepoll[]
  ) {
  }
  hasActiveLivepoll(): boolean {
    for (const poll of this.polls) {
      if(poll.config.isLive){
        return true;
      }
    }
  }
}
