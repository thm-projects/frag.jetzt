import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Comment, Language as CommentLanguage } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';
import { LanguagetoolService, Language, LanguagetoolResult } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords } from '../../../../utils/create-comment-keywords';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { DeepLDialogComponent } from '../deep-ldialog/deep-ldialog.component';
import { DeepLService, SourceLang, TargetLang } from '../../../../services/http/deep-l.service';

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
    private deeplService: DeepLService,
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
    comment.createdFromLecturer = this.user.role > 0;
    comment.tag = tag;
    comment.questionerName = name;
    this.isSendingToSpacy = true;
    this.openSpacyDialog(comment, text, forward);
  }

  openSpacyDialog(comment: Comment, rawText: string, forward: boolean): void {
    CreateCommentKeywords.isSpellingAcceptable(this.languagetoolService, rawText, this.commentComponent.selectedLang)
      .subscribe((result) => {
        if (result.isAcceptable) {
          if (forward) {
            this.callDeepL(comment, result.text, result.result);
          } else {
            this.callSpacy(comment, result.text, result.result);
          }
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

  private callDeepL(comment: Comment, text: string, result: LanguagetoolResult) {
    let target = TargetLang.EN_US;
    const code = result.language.detectedLanguage.code.toUpperCase().split('-')[0];
    if (code.startsWith(SourceLang.EN)) {
      target = TargetLang.DE;
    }
    DeepLDialogComponent.generateDeeplDelta(this.deeplService, comment.body, target)
      .subscribe(([improvedBody, improvedText]) => {
        comment.body = improvedBody;
        this.callSpacy(comment, improvedText, result, true);
      }, () => {
        this.callSpacy(comment, text, result, true);
      });
  }

  private callSpacy(comment: Comment, text: string, result: LanguagetoolResult, forward = false) {
    const commentLang = this.languagetoolService.mapLanguageToSpacyModel(result.language.code as Language);
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
        commentBodyChecked: text,
        forward
      }
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dialogRef.close(dialogResult);
      }
    });
  }
}
