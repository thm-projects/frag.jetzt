import { LivepollTemplate } from './livepoll-template';

export interface LivepollConfiguration {
  template: LivepollTemplate;
  title?: string;
  resultVisible: boolean;
  viewsVisible: boolean;
  isLive: boolean;
  roomId?: string;
}

export const defaultLivepollConfiguration: LivepollConfiguration = {
  title: undefined,
  viewsVisible: false,
  resultVisible: false,
  isLive: false,
  template: LivepollTemplate.Symbol,
};
