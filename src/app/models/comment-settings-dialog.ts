export class CommentSettingsDialog {
  threshold: number;
  directSend: boolean;

  constructor(
    threshold: number = -100,
    directSend: boolean = true,
  ) {
    this.threshold = threshold;
    this.directSend = directSend;
  }
}
