import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';
import { ReplaySubject } from 'rxjs';
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

const baseAnimationDuration = 100;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-focus',
  standalone: true,
  imports: [
    ArsModule,
    MatButton,
    MatIcon,
    CustomMarkdownModule,
    QwCommentFooterComponent,
    NgIf,
    QwCommentResponseWindowComponent,
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
  // eslint-disable-next-line @angular-eslint/no-host-metadata-property
  host: {
    '[@flyInOut]': `baseAnimationState`,
  },
})
export class QwCommentFocusComponent implements OnDestroy {
  public readonly comment: ForumComment;
  destroyer: ReplaySubject<1>;
  public baseAnimationState: '_0' | '_1' = '_1';

  protected answersExpanded: boolean = false;
  protected replies: ForumComment[] | undefined;

  @ViewChild('markdownViewerComponent') set _markdownViewerComponent(
    component: MarkdownViewerComponent,
  ) {
    this.data.session.focusScale.subscribe((value) => {
      try {
        // dirty trick
        setTimeout(() => {
          const element = component
            .editorElement()
            .nativeElement.getElementsByClassName(
              'toastui-editor-contents',
            )[0] as HTMLElement;
          element.style.fontSize = value + '%';
        });
      } catch (e) {
        console.log(e);
      }
    });
  }

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
    public readonly cdr: ChangeDetectorRef,
    public readonly commentService: CommentService,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: ComponentData<{
      comment: ForumComment;
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
    console.log(data);
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
}
