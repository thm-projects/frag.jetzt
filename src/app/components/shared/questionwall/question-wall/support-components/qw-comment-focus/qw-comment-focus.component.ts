import {
  ChangeDetectorRef,
  Component,
  HostBinding,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';
import { first, ReplaySubject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ComponentData } from '../../../component-builder-support';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { QwCommentFooterComponent } from '../qw-comment-footer/qw-comment-footer.component';
import { NgIf } from '@angular/common';
import { CommentService } from '../../../../../../services/http/comment.service';
import { QwCommentResponseWindowComponent } from '../qw-comment-response-window/qw-comment-response-window.component';
import { MarkdownViewerComponent } from '../../../../../../base/custom-markdown/markdown-viewer/markdown-viewer.component';
import { QwRunningNumberBackgroundComponent } from '../qw-running-number-background/qw-running-number-background.component';
import { UIComment } from 'app/room/state/comment-updates';

const baseAnimationDuration = 100;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-focus',
  imports: [
    ArsModule,
    MatButton,
    MatIcon,
    CustomMarkdownModule,
    QwCommentFooterComponent,
    NgIf,
    QwCommentResponseWindowComponent,
    QwRunningNumberBackgroundComponent,
  ],
  templateUrl: './qw-comment-focus.component.html',
  styleUrl: './qw-comment-focus.component.scss',
  animations: [
    trigger('flyInOut', [
      state('_0', style({ opacity: 0 })),
      state('_1', style({ opacity: 1 })),
      transition(':enter', [
        style({
          opacity: 0,
        }),
        animate(
          `${baseAnimationDuration}ms ease-in-out`,
          style({
            opacity: 1,
          }),
        ),
      ]),
      transition('_1 => _0', [
        style({
          opacity: 1,
        }),
        animate(
          `${baseAnimationDuration}ms ease-in-out`,
          style({
            opacity: 0,
          }),
        ),
      ]),
    ]),
  ],
})
export class QwCommentFocusComponent implements OnDestroy {
  public readonly comment: UIComment;
  destroyer: ReplaySubject<1>;
  @HostBinding('@flyInOut')
  public baseAnimationState: '_0' | '_1' = '_1';

  protected answersExpanded: boolean = false;
  protected replies: UIComment[] | undefined;

  @ViewChild('markdownViewerComponent') set _markdownViewerComponent(
    component: MarkdownViewerComponent,
  ) {
    this.data.session.focusScale.subscribe((value) => {
      component.renderedPreview$.pipe(first()).subscribe(() => {
        const element = component
          .editorElement()
          .nativeElement.getElementsByClassName(
            'toastui-editor-contents',
          )[0] as HTMLElement;
        element.style.fontSize = value + '%';
      });
    });
  }

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
    public readonly cdr: ChangeDetectorRef,
    public readonly commentService: CommentService,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: ComponentData<{
      comment: UIComment;
      session: QuestionWallSession;
    }>,
  ) {
    this.comment = data.comment;
    this.destroyer = data.destroyer;
    data.prepareDestroy.subscribe(() => {
      // e.g.: on animate out, create delay here
      this.baseAnimationState = '_0';
      setTimeout(() => {
        data.destroyPrepared.next(1);
      }, baseAnimationDuration);
    });
    self
      .getSession()
      .subscribe((session) =>
        session
          .generateCommentReplyStream(this.destroyer, data.comment)
          .subscribe((replies) => (this.replies = replies)),
      );
  }

  ngOnDestroy(): void {
    this.destroyer.next(1);
  }

  protected readonly Object = Object;
}
