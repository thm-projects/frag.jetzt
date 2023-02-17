import { LivepollTemplate } from './livepoll-template';

export interface LivepollConfiguration {
  template: LivepollTemplate;
  title?: string;
  isResultVisible: boolean;
  isViewsVisible: boolean;
  isLive: boolean;
}
