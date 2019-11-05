export class CommentSettingsDialog {
  enableThreshold: boolean;
  threshold: number;
  enableModeration: boolean;
  directSend: boolean;
  enableTags: boolean;
  tags: string[];

  constructor(
    enableThreshold: boolean = false,
    threshold: number = -100,
    enableModeration: boolean = false,
    directSend: boolean = true,
    enableTags: boolean = false,
    tags: string[] = []
  ) {
    this.enableThreshold = enableThreshold;
    this.threshold = threshold;
    this.enableModeration = enableModeration;
    this.directSend = directSend;
    this.enableTags = enableTags;
    this.tags = tags;
  }
}
