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
import { DeepLDialogComponent } from '../deep-ldialog/deep-ldialog.component';
import { DeepLService } from '../../../../services/http/deep-l.service';
import { Observable } from 'rxjs';
import { ViewCommentDataComponent } from '../../view-comment-data/view-comment-data.component';
import { map } from 'rxjs/operators';

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
  maxTextCharacters = 500;
  maxDataCharacters = 1500;
  isSendingToSpacy = false;
  isModerator = false;

  constructor(
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog,
    public languagetoolService: LanguagetoolService,
    public eventService: EventService,
    private deeplService: DeepLService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  private static encodeHTML(str: string): string {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private static decodeHTML(str: string): string {
    return str.replace(/&apos;/g, '\'')
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&');
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.isModerator = this.user && this.user.role > 0;
    this.maxTextCharacters = this.isModerator ? 1000 : 500;
    this.maxDataCharacters = this.isModerator ? this.maxTextCharacters * 5 : this.maxTextCharacters * 3;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  closeDialog(body: string, text: string, tag: string) {
    const comment = new Comment();
    comment.roomId = localStorage.getItem(`roomId`);
    comment.body = body;
    comment.creatorId = this.user.id;
    comment.createdFromLecturer = this.user.role > 0;
    comment.tag = tag;
    this.isSendingToSpacy = true;
    this.openDeeplDialog(body, text, (newBody: string, newText: string) => {
      comment.body = newBody;
      this.openSpacyDialog(comment, newText);
    });
  }

  openDeeplDialog(body: string, text: string, onClose: (data: string, text: string) => void) {
    this.generateDeeplDelta(body).subscribe(([improvedBody, improvedText]) => {
      this.isSendingToSpacy = false;
      this.dialog.open(DeepLDialogComponent, {
        width: '900px',
        maxWidth: '100%',
        data: {
          body,
          text,
          improvedBody,
          improvedText,
          maxTextCharacters: this.maxTextCharacters,
          maxDataCharacters: this.maxDataCharacters,
          isModerator: this.isModerator
        }
      }).afterClosed().subscribe((res) => {
        if (res) {
          onClose(res.body, res.text);
        }
      });
    }, (_) => {
      this.isSendingToSpacy = false;
      onClose(body, text);
    });
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

  private generateDeeplDelta(body: string): Observable<[string, string]> {
    const delta = ViewCommentDataComponent.getDeltaFromData(body);
    const xml = delta.ops.reduce((acc, e, i) => {
      if (typeof e['insert'] === 'string' && e['insert'].trim().length) {
        acc += '<x i="' + i + '">' + CreateCommentComponent.encodeHTML(e['insert']) + '</x>';
        e['insert'] = '';
      }
      return acc;
    }, '');
    return this.deeplService.improveTextStyle(xml).pipe(
      map(str => {
        const regex = /<x i="(\d+)">([^<]+)<\/x>/gm;
        let m;
        while ((m = regex.exec(str)) !== null) {
          delta.ops[+m[1]]['insert'] += CreateCommentComponent.decodeHTML(m[2]);
        }
        const text = delta.ops.reduce((acc, el) => acc + (typeof el['insert'] === 'string' ? el['insert'] : ''), '');
        return [ViewCommentDataComponent.getDataFromDelta(delta), text];
      })
    );
  }
}
