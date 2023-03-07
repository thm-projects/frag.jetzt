import { LivepollTemplate } from './livepoll-template';
import { defaultLivepollConfiguration } from './livepoll-configuration';

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
  new: boolean;

  constructor(
    id: string = '',
    roomId: string = '',
    active: boolean = true,
    template: LivepollTemplate = defaultLivepollConfiguration.template,
    title: string | null = null,
    resultVisible: boolean = defaultLivepollConfiguration.resultVisible,
    viewsVisible: boolean = defaultLivepollConfiguration.viewsVisible,
    createdAt: Date | null = null,
    updatedAt: Date | null = null,
    _new: boolean = false,
  ) {
    this.id = id;
    this.roomId = roomId;
    this.active = active;
    this.template = template;
    this.title = title;
    this.resultVisible = resultVisible;
    this.viewsVisible = viewsVisible;
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
    this.new = _new;
  }
}
