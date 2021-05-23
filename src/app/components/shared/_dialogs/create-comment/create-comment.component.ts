import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { User } from '../../../../models/user';
import { CommentListComponent } from '../../comment-list/comment-list.component';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';
import { LanguagetoolService, Language } from '../../../../services/http/languagetool.service';

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
  inputText = '';

  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';

  bodyForm = new FormControl('', [Validators.required]);

  @ViewChild('commentBody', { static: true })commentBody: HTMLDivElement;

  constructor(
    private notification: NotificationService,
    public dialogRef: MatDialogRef<CommentListComponent>,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private translationService: TranslateService,
    public languagetoolService: LanguagetoolService,
    public eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    setTimeout(() => {
      document.getElementById('answer-input').focus();
    }, 0);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkInputData(body: string): boolean {
    body = body.trim();
    if (!body) {
      this.translationService.get('comment-page.error-comment').subscribe(message => {
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
      this.openSpacyDialog(comment);
    }
  }

  openSpacyDialog(comment: Comment): void {
    this.checkSpellings(this.inputText).subscribe((res) => {
      const words: string[] = this.inputText.trim().split(' ');
      const errorQuotient = (res.matches.length * 100) / words.length;

      if (errorQuotient <= 20) {
        let commentBodyChecked = this.inputText;
        const commentLang = this.languagetoolService.mapLanguageToSpacyModel(res.language.code);

        for (let i = res.matches.length - 1; i >= 0; i--) {
          commentBodyChecked = commentBodyChecked.substr(0, res.matches[i].offset) +
            commentBodyChecked.substr(res.matches[i].offset + res.matches[i].length, commentBodyChecked.length);
        }

        const dialogRef = this.dialog.open(SpacyDialogComponent, {
          data: {
            comment,
            commentLang,
            commentBodyChecked
          }
        });

        dialogRef.afterClosed()
          .subscribe(result => {
            if (result) {
this.dialogRef.close(result);
}
          });
      } else {
        this.dialogRef.close(comment);
      }
    });
  };


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.onNoClick();
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildCreateCommentActionCallback(text: HTMLDivElement): () => void {
    return () => this.closeDialog(text.innerText);
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  maxLength(commentBody: HTMLDivElement): void {
    this.inputText = commentBody.innerText;
    if(this.user.role === 3 && commentBody.innerText.length > 1000) {
      commentBody.innerText = commentBody.innerText.slice(0, 1000);
    } else if(this.user.role !== 3 && commentBody.innerText.length > 500){
      commentBody.innerText = commentBody.innerText.slice(0, 500);
    }
  }

  grammarCheck(commentBody: HTMLDivElement): void {
    const wrongWords: string[] = [];
    commentBody.innerHTML = this.inputText;
    this.checkSpellings(commentBody.innerText).subscribe((wordsCheck) => {
      if(wordsCheck.matches.length > 0 ) {
        wordsCheck.matches.forEach(grammarError => {
          const wrongWord = commentBody.innerText.slice(grammarError.offset, grammarError.offset + grammarError.length);
          wrongWords.push(wrongWord);
        });

        this.checkSpellings(commentBody.innerHTML).subscribe((res) => {
          for(let i = res.matches.length - 1; i >= 0; i--) {
            const wrongWord = commentBody.innerHTML
              .slice(res.matches[i].offset, res.matches[i].offset + res.matches[i].length);

            if (wrongWords.includes(wrongWord)) {
              const suggestions: any[] = res.matches[i].replacements;
              let displayOptions= 3;
              let suggestionsHTML = '';

              if(!suggestions.length) {
                suggestionsHTML = '<span style="color: black; display: block; text-align: center;">' + res.matches[i].message + '</span>';
}

              if(suggestions.length < displayOptions) {
                displayOptions = suggestions.length;
}

              for (let j = 0; j < displayOptions; j++) {
                // eslint-disable-next-line max-len
                  suggestionsHTML += '<span class="suggestions"' + ' style="color: black; display: block; text-align: center; cursor: pointer;">' + suggestions[j].value + '</span>';
              }

              const replacement =
                '<div class="markUp" style="position: relative; display: inline-block; border-bottom: 1px dotted black">' +
                '   <span style="text-decoration: underline wavy red; cursor: pointer;">' +
                      wrongWord +
                '   </span>' +
                // eslint-disable-next-line max-len
                '     <div class="dropdownBlock" style="display: none; width: 160px; background-color: white; border-style: solid; border-color: var(--primary); color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1000; bottom: 100%; left: 50%; margin-left: -80px;">' +
                        suggestionsHTML +
                '     </div>' +
                '</div>';

              commentBody.innerHTML = commentBody.innerHTML.substr(0, res.matches[i].offset) +
                replacement + commentBody.innerHTML.substr(res.matches[i].offset + wrongWord.length, commentBody.innerHTML.length);
            }
          }

          setTimeout(() => {
            Array.from(document.getElementsByClassName('markUp')).forEach(marked=>{
              marked.addEventListener('click',()=>{
                marked.outerHTML = marked.outerHTML.replace('display: none','display: block');

                setTimeout(() => {
                  Array.from(document.getElementsByClassName('suggestions')).forEach(e => {
                    e.addEventListener('click', () => {
                      e.parentElement.parentElement.outerHTML = e.innerHTML;
                      this.inputText = commentBody.innerText;
                    });
                  });
                }, 500);
              });
            });
          }, 500);
        });
      }
    });
  }
}
