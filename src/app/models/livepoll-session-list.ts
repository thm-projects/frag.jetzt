import { Livepoll } from './livepoll';

export class LivepollSessionList {
  constructor(
    public polls: Livepoll[]
  ) {
  }
  hasActiveLivepoll(): boolean {
    if(this.polls.length === 0){
      return false;
    } else {
      for (const poll of this.polls) {
        if(poll.config.isLive){
          return true;
        }
      }
      return false;
    }
  }
}
