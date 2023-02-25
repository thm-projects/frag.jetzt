import { LivepollTemplate } from './livepoll-template';

export interface LivepollConfiguration {
  template: LivepollTemplate;
  title?: string;
  isResultVisible: boolean;
  isViewsVisible: boolean;
  isLive: boolean;
}

export const defaultLivepollConfiguration: LivepollConfiguration = {
  title: undefined,
  isViewsVisible: true,
  isResultVisible: true,
  isLive: false,
  template: LivepollTemplate.Symbol
};
