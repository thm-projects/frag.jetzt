import { LivepollConfiguration } from './livepoll-configuration';
import { LivepollResult } from './livepoll-result';

export class Livepoll {
  constructor(
    public config: LivepollConfiguration,
    public results: LivepollResult[],
    public readonly date: Date
  ) {
  }
}
