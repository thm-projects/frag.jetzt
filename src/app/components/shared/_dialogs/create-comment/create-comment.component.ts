import { Component, Inject, OnInit } from '@angular/core';
import { Comment, Language as CommentLanguage } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { CommentListComponent } from '../../comment-list/comment-list.component';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';
import { LanguagetoolService, Language } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords } from '../../../../utils/create-comment-keywords';
import { GrammarChecker } from '../../../../utils/grammar-checker';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {

  comment: Comment;
  user: User;
  roomId: string;
  tags: string[];
  selectedTag: string;
  isSendingToSpacy = false;
  grammarChecker: GrammarChecker;
  tempEditView: string;

  constructor(
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CommentListComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog,
    public languagetoolService: LanguagetoolService,
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.grammarChecker = new GrammarChecker(this.languagetoolService);
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkInputData(body: string): boolean {
    body = body.trim();
    if (!body) {
      this.translateService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    return true;
  }

  closeDialog(body: string) {
    if (this.checkInputData(body) === true) {
      const comment = new Comment();
      comment.roomId = localStorage.getItem(`roomId`);
      comment.body = body;
      comment.creatorId = this.user.id;
      comment.createdFromLecturer = this.user.role === 1;
      comment.tag = this.selectedTag;
      this.isSendingToSpacy = true;
      this.openSpacyDialog(comment);
    }
  }

  openSpacyDialog(comment: Comment): void {
    CreateCommentKeywords.isSpellingAcceptable(this.languagetoolService, comment.body, this.grammarChecker.selectedLang)
      .subscribe((result) => {
        if (result.isAcceptable) {
          const commentLang = this.languagetoolService.mapLanguageToSpacyModel(result.result.language.code as Language);
          const selectedLangExtend = this.grammarChecker.selectedLang[2] === '-' ?
            this.grammarChecker.selectedLang.substr(0, 2) : this.grammarChecker.selectedLang;
          // Store language if it was auto-detected
          if (this.grammarChecker.selectedLang === 'auto') {
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

  buildCloseDialogActionCallback(): () => void {
    return () => this.onNoClick();
  }

  buildCreateCommentActionCallback(): (string) => void {
    return (text: string) => this.closeDialog(text);
  }
}
