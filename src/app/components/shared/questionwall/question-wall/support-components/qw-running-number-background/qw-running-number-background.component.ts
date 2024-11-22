import { Component, Input } from '@angular/core';

export type RunningNumberMarker = 'moderator';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-running-number-background',
  imports: [],
  templateUrl: './qw-running-number-background.component.html',
  styleUrl: './qw-running-number-background.component.scss',
})
export class QwRunningNumberBackgroundComponent {
  @Input() userIdentifier: string | undefined;

  @Input() set commentIdentifier(commentIdentifier: string | undefined) {
    // todo(Bimberg) is Comment.getPrettyCommentNumber still up-to-date?
    this._commentIdentifier = commentIdentifier;
  }

  protected _commentIdentifier: string | undefined;
  @Input() marker: RunningNumberMarker | undefined;
}
