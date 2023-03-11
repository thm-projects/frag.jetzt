import { LivepollTemplate } from './livepoll-template';
import { defaultLivepollConfiguration } from './livepoll-configuration';
import { verifyInstance } from 'app/utils/ts-utils';

export class LivepollSession {
  id: string;
  roomId: string;
  active: boolean;
  template: LivepollTemplate;
  title: string | null;
  resultVisible: boolean;
  viewsVisible: boolean;
  createdAt: Date;
  updatedAt: Date | null;

  constructor({
    id = '',
    roomId = '',
    active = true,
    template = defaultLivepollConfiguration.template,
    title = null,
    resultVisible = defaultLivepollConfiguration.resultVisible,
    viewsVisible = defaultLivepollConfiguration.viewsVisible,
    createdAt = new Date(),
    updatedAt = null,
  }: LivepollSession) {
    this.id = id;
    this.roomId = roomId;
    this.active = active;
    this.template = template;
    this.title = title;
    this.resultVisible = resultVisible;
    this.viewsVisible = viewsVisible;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
