import { LivepollTemplate } from './livepoll-template';
import { defaultLivepollConfiguration } from './livepoll-configuration';
import { UUID, verifyInstance } from 'app/utils/ts-utils';

export class LivepollCustomTemplateEntry {
  id: UUID;
  sessionId: UUID;
  index: number;
  icon: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    sessionId = null,
    index = -1,
    icon = null,
    text = null,
    createdAt = new Date(),
    updatedAt = null,
  }: Partial<LivepollCustomTemplateEntry>) {
    this.id = id;
    this.sessionId = sessionId;
    this.index = index;
    this.icon = icon;
    this.text = text;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}

export class LivepollSession {
  id: string;
  roomId: string;
  active: boolean;
  template: LivepollTemplate;
  title: string | null;
  resultVisible: boolean;
  viewsVisible: boolean;
  paused: boolean;
  customEntries: LivepollCustomTemplateEntry[];
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
    paused = false,
    customEntries = [],
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
    this.paused = paused;
    this.customEntries = customEntries.map((x) =>
      verifyInstance(LivepollCustomTemplateEntry, x),
    );
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
