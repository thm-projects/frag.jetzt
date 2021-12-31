import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { Comment, Language as CommentLanguage } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../../models/user';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';
import { Language, LanguagetoolService } from '../../../../services/http/languagetool.service';
import { CreateCommentKeywords, KeywordsResultType } from '../../../../utils/create-comment-keywords';
import { WriteCommentComponent } from '../../write-comment/write-comment.component';
import { DeepLService } from '../../../../services/http/deep-l.service';
import { SpacyService } from '../../../../services/http/spacy.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';
import { CURRENT_SUPPORTED_LANGUAGES } from '../../../../services/http/spacy.interface';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { BrainstormingSession } from '../../../../models/brainstorming-session';

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
  @Input() brainstormingData: BrainstormingSession;
  isSendingToSpacy = false;
  isModerator = false;

  constructor(
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    private roomDataService: RoomDataService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    public languagetoolService: LanguagetoolService,
    private deeplService: DeepLService,
    private spacyService: SpacyService,
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  static getWords(text: string): string[] {
    return text.split(/\s+/g).filter(e => e.trim().length);
  }

  static getTerm(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.isModerator = this.userRole > 0;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  forwardComment(body: string, text: string, tag: string, name: string, verifiedWithoutDeepl: boolean) {
    this.createComment(body, tag, name, !verifiedWithoutDeepl);
  }

  closeDialog(body: string, text: string, tag: string, name: string) {
    this.createComment(body, tag, name);
  }

  createComment(body: string, tag: string, name: string, forward = false) {
    const comment = new Comment();
    comment.roomId = localStorage.getItem(`roomId`);
    comment.body = CreateCommentKeywords.transformURLtoQuill(body, this.isModerator);
    comment.creatorId = this.user.id;
    comment.createdFromLecturer = this.userRole > 0;
    comment.tag = tag;
    comment.questionerName = name;
    comment.brainstormingQuestion = !!this.brainstormingData;
    this.isSendingToSpacy = true;
    if (comment.brainstormingQuestion) {
      this.generateBrainstormingKeywords(comment);
    } else {
      this.openSpacyDialog(comment, forward, false);
    }
  }

  generateBrainstormingKeywords(comment: Comment) {
    const text = ViewCommentDataComponent.getTextFromData(comment.body);
    const term = CreateCommentComponent.getTerm(text);
    const send = (termText: string) => {
      this.isSendingToSpacy = false;
      if (this.wasWritten(termText)) {
        this.translateService.get('comment-page.error-brainstorm-duplicate')
          .subscribe(msg => this.notification.show(msg));
        return;
      }
      comment.keywordsFromSpacy = [{
        text: termText,
        dep: ['ROOT']
      }];
      this.dialogRef.close(comment);
    };
    if (CreateCommentComponent.getWords(term).length > 1) {
      send(term);
      return;
    }
    const selectedLanguage = this.commentComponent.selectedLang;
    this.languagetoolService.checkSpellings(term, selectedLanguage)
      .subscribe(result => {
        if (selectedLanguage === 'auto' && result.language.detectedLanguage.confidence < 0.5) {
          send(term);
          return;
        }
        const selectedLangExtend =
          selectedLanguage[2] === '-' ? selectedLanguage.substr(0, 2) : selectedLanguage;
        let finalLanguage: CommentLanguage;
        const commentModel = this.languagetoolService.mapLanguageToSpacyModel(result.language.code as Language);
        if (selectedLanguage === 'auto') {
          finalLanguage = Comment.mapModelToLanguage(commentModel);
        } else if (CommentLanguage[selectedLangExtend]) {
          finalLanguage = CommentLanguage[selectedLangExtend];
        }
        comment.language = finalLanguage;
        const isResultLangSupported = this.languagetoolService.isSupportedLanguage(result.language.code as Language);
        if (!isResultLangSupported || !CURRENT_SUPPORTED_LANGUAGES.includes(commentModel)) {
          send(term);
          return;
        }
        this.spacyService.getKeywords(term, commentModel, true)
          .subscribe((keywords) => {
              send(keywords.map(kw => kw.text).join(' '));
            },
            () => send(term));
      });
  }

  openSpacyDialog(comment: Comment, forward: boolean, brainstorming: boolean): void {
    CreateCommentKeywords.generateKeywords(this.languagetoolService, this.deeplService,
      this.spacyService, comment.body, brainstorming, forward, this.commentComponent.selectedLang)
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

  private wasWritten(term: string): boolean {
    if (!this.roomDataService.getCurrentRoomData(false)) {
      return true;
    }
    const areEqual = (str1: string, str2: string): boolean =>
      str1.localeCompare(str2, undefined, { sensitivity: 'base' }) === 0;
    return this.roomDataService.getCurrentRoomData(false).some(comment => comment.brainstormingQuestion &&
      comment.creatorId === this.user?.id &&
      comment.keywordsFromSpacy?.some(kw => areEqual(kw.text, term)));
  }
}
