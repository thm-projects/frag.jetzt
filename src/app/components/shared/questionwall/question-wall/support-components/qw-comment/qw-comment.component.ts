import {
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import {
  MatCard,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';
import { QwCommentFooterComponent } from '../qw-comment-footer/qw-comment-footer.component';
import { ReplaySubject, takeUntil } from 'rxjs';
import { NgStyle } from '@angular/common';
import { QwCommentQuestionerBackgroundComponent } from '../qw-comment-questioner-background/qw-comment-questioner-background.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment',
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardFooter,
    MatCardTitle,
    ArsModule,
    MatIcon,
    MatButton,
    CustomMarkdownModule,
    QwCommentFooterComponent,
    NgStyle,
    QwCommentQuestionerBackgroundComponent,
  ],
  templateUrl: './qw-comment.component.html',
  styleUrl: './qw-comment.component.scss',
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '[class.highlight]': `_isFocused`,
  },
})
export class QwCommentComponent implements OnDestroy, OnInit {
  @Input() config!: {
    session: QuestionWallSession;
    comment: ForumComment;
  };
  _destroyer: ReplaySubject<1> = new ReplaySubject<1>();
  _isFocused = false;

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
  ) {}

  ngOnInit() {
    this.config.session.focus
      .pipe(takeUntil(this._destroyer))
      .subscribe((focus) => {
        if (focus && this.config.comment.id === focus.id) {
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
    if (this.self.session.focus.value?.id !== this.config.comment.id) {
      this.self.session.focus.next(this.config.comment);
    }
  }
}
