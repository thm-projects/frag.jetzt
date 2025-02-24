import {
  Component,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';
import { QwCommentFooterComponent } from '../qw-comment-footer/qw-comment-footer.component';
import { ReplaySubject, takeUntil } from 'rxjs';
import { QwRunningNumberBackgroundComponent } from '../qw-running-number-background/qw-running-number-background.component';
import { UIComment } from 'app/room/state/comment-updates';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment',
  imports: [
    ArsModule,
    CustomMarkdownModule,
    QwCommentFooterComponent,
    QwRunningNumberBackgroundComponent,
  ],
  templateUrl: './qw-comment.component.html',
  styleUrl: './qw-comment.component.scss',
})
export class QwCommentComponent implements OnDestroy, OnInit {
  @Input() data!: {
    session: QuestionWallSession;
    comment: UIComment;
  };
  _destroyer: ReplaySubject<1> = new ReplaySubject<1>();
  @HostBinding('class.highlight')
  _isFocused = false;

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
  ) {}

  ngOnInit() {
    this.data.session.focus
      .pipe(takeUntil(this._destroyer))
      .subscribe((focus) => {
        if (focus && this.data.comment.comment.id === focus.id) {
          if (!this._isFocused) {
            this._isFocused = true;
          }
        } else {
          if (this._isFocused) {
            this._isFocused = false;
          }
        }
      });
  }

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
  }

  @HostListener('click') _click() {
    if (this.self.session.focus.value?.id !== this.data.comment.comment.id) {
      this.self.session.focus.next(this.data.comment.comment);
    }
  }
}
