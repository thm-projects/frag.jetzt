export class LivepollSession {
  id: string;
  roomId: string;
  active: boolean;
  title: string;
  template: string;
  resultVisible: boolean;
  viewsVisible: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string = '',
    roomId: string = '',
    active: boolean = false,
    title: string = '',
    template: string = '',
    resultVisible: boolean = true,
    viewsVisible: boolean = true,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.title = title;
    this.template = template;
    this.resultVisible = resultVisible;
    this.viewsVisible = viewsVisible;
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
  }
}
