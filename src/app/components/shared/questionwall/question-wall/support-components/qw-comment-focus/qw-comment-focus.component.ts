import { ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { QuestionWallService } from '../../question-wall.service';
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

  set expandAnswers(value: boolean) {
    this._expandAnswers = value;
    if (value) {
      this.loadAnswers();
    }
  }

  get expandAnswers(): boolean {
    return this._expandAnswers;
  }

  private _expandAnswers: boolean = false;

  constructor(
    public readonly self: QuestionWallService,
    public readonly dateFormatter: ArsDateFormatter,
    public readonly cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: ComponentData<{
      comment: ForumComment;
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
  }

  ngOnDestroy(): void {
    this.destroyer.next(1);
  }

  private loadAnswers() {
    this.self.getAnswers();
  }
}
