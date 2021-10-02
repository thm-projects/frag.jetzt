import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Comment, Language as CommentLanguage } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';
import { LanguagetoolService, Language } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords } from '../../../../utils/create-comment-keywords';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;
  @Input() user: User;
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
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.isModerator = this.user && this.user.role > 0;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  closeDialog(body: string, text: string, tag: string, name: string) {
    const comment = new Comment();
    comment.roomId = localStorage.getItem(`roomId`);
    comment.body = body;
    comment.creatorId = this.user.id;
    comment.createdFromLecturer = this.user.role > 0;
    comment.tag = tag;
    comment.questionerName = name;
    this.isSendingToSpacy = true;
    this.openSpacyDialog(comment, text);
  }

  openSpacyDialog(comment: Comment, rawText: string): void {
    CreateCommentKeywords.isSpellingAcceptable(this.languagetoolService, rawText, this.commentComponent.selectedLang)
      .subscribe((result) => {
        if (result.isAcceptable) {
          const commentLang = this.languagetoolService.mapLanguageToSpacyModel(result.result.language.code as Language);
          const selectedLangExtend = this.commentComponent.selectedLang[2] === '-' ?
            this.commentComponent.selectedLang.substr(0, 2) : this.commentComponent.selectedLang;
          // Store language if it was auto-detected
          if (this.commentComponent.selectedLang === 'auto') {
            comment.language = Comment.mapModelToLanguage(commentLang);
          } else if (CommentLanguage[selectedLangExtend]) {
            comment.language = CommentLanguage[selectedLangExtend];
          }
          const dialogRef = this.dialog.open(SpacyDialogComponent, {
            data: {
              comment,
              commentLang,
              commentBodyChecked: result.text
            }
          });
          dialogRef.afterClosed().subscribe(dialogResult => {
            if (dialogResult) {
              this.dialogRef.close(dialogResult);
            }
          });
        } else {
          comment.language = CommentLanguage.auto;
          this.dialogRef.close(comment);
        }
        this.isSendingToSpacy = false;
      }, () => {
        comment.language = CommentLanguage.auto;
        this.dialogRef.close(comment);
        this.isSendingToSpacy = false;
      });
  }
}
