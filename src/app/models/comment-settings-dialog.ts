export class CommentSettingsDialog {
  enableThreshold: boolean;
  threshold: number;
  enableModeration: boolean;
  directSend: boolean;

  constructor(
    enableThreshold: boolean = false,
    threshold: number = -100,
    enableModeration: boolean = false,
    directSend: boolean = true
  ) {
    this.enableThreshold = enableThreshold;
    this.threshold = threshold;
    this.enableModeration = enableModeration;
    this.directSend = directSend;
  }
}
