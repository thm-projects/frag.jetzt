import { Component, Inject, OnDestroy } from '@angular/core';
import { ForumComment } from '../../../../../../utils/data-accessor';
import { QuestionWallService } from '../../question-wall.service';
import { ArsModule } from '../../../../../../../../projects/ars/src/lib/ars.module';
import { ArsDateFormatter } from '../../../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CustomMarkdownModule } from '../../../../../../base/custom-markdown/custom-markdown.module';
import { Observable, of, ReplaySubject } from 'rxjs';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-comment-focus',
  standalone: true,
  imports: [ArsModule, MatButton, MatIcon, CustomMarkdownModule],
  templateUrl: './qw-comment-focus.component.html',
  styleUrl: './qw-comment-focus.component.scss',
})
export class QwCommentFocusComponent implements OnDestroy {
  public readonly comment: ForumComment;
  destroyer: ReplaySubject<1> = new ReplaySubject<1>();

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
    @Inject(MAT_DIALOG_DATA)
    data: {
      comment: ForumComment;
    },
  ) {
    this.comment = data.comment;
    console.log(data);
  }

  ngOnDestroy(): void {
    this.destroyer.next(1);
  }

  private loadAnswers() {
    this.self.getAnswers();
  }

  destroy(): Observable<void> {
    return of(undefined);
  }
}
