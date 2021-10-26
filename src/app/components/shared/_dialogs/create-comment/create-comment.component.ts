import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';
import { LanguagetoolService } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords, KeywordsResultType } from '../../../../utils/create-comment-keywords';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { DeepLService } from '../../../../services/http/deep-l.service';
import { SpacyService } from '../../../../services/http/spacy.service';
import { UserRole } from '../../../../models/user-roles.enum';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;
  @Input() user: User;
  @Input() userRole: UserRole;
  @Input() roomId: string;
  @Input() tags: string[];
  isSendingToSpacy = false;
  isModerator = false;

  constructor(
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog,
    public languagetoolService: LanguagetoolService,
    private deeplService: DeepLService,
    private spacyService: SpacyService,
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.isModerator = this.userRole > 0;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  forwardComment(body: string, text: string, tag: string, name: string, verifiedWithoutDeepl: boolean) {
    this.createComment(body, text, tag, name, !verifiedWithoutDeepl);
  }

  closeDialog(body: string, text: string, tag: string, name: string) {
    this.createComment(body, text, tag, name);
  }

  createComment(body: string, text: string, tag: string, name: string, forward = false) {
    const comment = new Comment();
    comment.roomId = localStorage.getItem(`roomId`);
    comment.body = body;
    comment.creatorId = this.user.id;
    comment.createdFromLecturer = this.userRole > 0;
    comment.tag = tag;
    comment.questionerName = name;
    this.isSendingToSpacy = true;
    this.openSpacyDialog(comment, text, forward);
  }

  openSpacyDialog(comment: Comment, rawText: string, forward: boolean): void {
    CreateCommentKeywords.generateKeywords(this.languagetoolService, this.deeplService,
      this.spacyService, comment.body, forward, this.commentComponent.selectedLang)
      .subscribe(result => {
        this.isSendingToSpacy = false;
        comment.language = result.language;
        comment.keywordsFromSpacy = result.keywords;
        comment.keywordsFromQuestioner = [];
        if (forward ||
          ((result.resultType === KeywordsResultType.failure) && !result.wasSpacyError) ||
          result.resultType === KeywordsResultType.badSpelled) {
          this.dialogRef.close(comment);
        } else {
          const dialogRef = this.dialog.open(SpacyDialogComponent, {
            data: {
              result: result.resultType,
              comment
            }
          });
          dialogRef.afterClosed().subscribe(dialogResult => {
            if (dialogResult) {
              this.dialogRef.close(dialogResult);
            }
          });
        }
      });
  }
}
