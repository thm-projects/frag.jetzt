import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export class CreateCommentComponent implements OnInit, OnDestroy {

  comment: Comment;

  user: User;
  roomId: string;
  tags: string[];
  selectedTag: string;
  inputText = '';
  body: string;

  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';

  bodyForm = new FormControl('', [Validators.required]);

  isSpellchecking = false;
  hasSpellcheckConfidence = true;

  @ViewChild('commentBody', { static: true }) commentBody: HTMLDivElement;

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
      document.addEventListener('click', this.onDocumentClick);
    }, 0);
  }

  onDocumentClick(e) {
    const container = document.getElementsByClassName('dropdownBlock');
    Array.prototype.forEach.call(container, (elem) => {
      if (!elem.contains(e.target) && (!(e.target as Node).parentElement.classList.contains('markUp')
        || (e.target as HTMLElement).dataset.id !== ((elem as Node).parentElement as HTMLElement).dataset.id)) {
        (elem as HTMLElement).style.display = 'none';
      }
    });
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  clearHTML(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    document.getElementById('answer-input').innerText += text.replace(/<[^>]*>?/gm, '');
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

  checkUTFEmoji(body: string): string{
    var regex = /(?:\:.*?\:|[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

    return  body.replace(regex, '');
  }

  openSpacyDialog(comment: Comment): void {
    let filteredInputText = this.checkUTFEmoji(this.inputText);
    this.checkSpellings(filteredInputText).subscribe((res) => {
      const words: string[] = filteredInputText.trim().split(' ');
      const errorQuotient = (res.matches.length * 100) / words.length;
      const hasSpellcheckConfidence = this.checkLanguageConfidence(res);

      if (hasSpellcheckConfidence && errorQuotient <= 20) {
        const commentLang = this.languagetoolService.mapLanguageToSpacyModel(res.language.code);

        const dialogRef = this.dialog.open(SpacyDialogComponent, {
          data: {
            comment,
            commentLang,
            commentBodyChecked: filteredInputText
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
    if (this.user.role === 3 && commentBody.innerText.length > 1000) {
      commentBody.innerText = commentBody.innerText.slice(0, 1000);
    } else if (this.user.role !== 3 && commentBody.innerText.length > 500) {
      commentBody.innerText = commentBody.innerText.slice(0, 500);
    }
    this.body = commentBody.innerText;
    if (this.body.length === 1 && this.body.charCodeAt(this.body.length - 1) === 10) {
      commentBody.innerHTML = commentBody.innerHTML.replace('<br>', '');
    }
    this.inputText = commentBody.innerText;
  }

  grammarCheck(commentBody: HTMLDivElement): void {
    const wrongWords: string[] = [];
    commentBody.innerHTML = this.inputText;
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    this.checkSpellings(commentBody.innerText).subscribe((wordsCheck) => {
      if (!this.checkLanguageConfidence(wordsCheck)) {
        this.hasSpellcheckConfidence = false;
        return;
      }

      if (wordsCheck.matches.length > 0) {
        wordsCheck.matches.forEach(grammarError => {
          const wrongWord = commentBody.innerText.slice(grammarError.offset, grammarError.offset + grammarError.length);
          wrongWords.push(wrongWord);
        });

        this.checkSpellings(commentBody.innerHTML).subscribe((res) => {
          for (let i = res.matches.length - 1; i >= 0; i--) {
            const wrongWord = commentBody.innerHTML
              .slice(res.matches[i].offset, res.matches[i].offset + res.matches[i].length);

            if (wrongWords.includes(wrongWord)) {
              const suggestions: any[] = res.matches[i].replacements;
              let displayOptions = 3;
              let suggestionsHTML = '';

              if (!suggestions.length) {
                suggestionsHTML = '<span style="color: black; display: block; text-align: center;">' + res.matches[i].message + '</span>';
              }

              if (suggestions.length < displayOptions) {
                displayOptions = suggestions.length;
              }

              for (let j = 0; j < displayOptions; j++) {
                // eslint-disable-next-line max-len
                suggestionsHTML += '<span class="suggestions"' + ' style="color: black; display: block; text-align: center; cursor: pointer;">' + suggestions[j].value + '</span>';
              }

              const replacement =
                '<div class="markUp" data-id="'+i+'" style="position: relative; display: inline-block; border-bottom: 1px dotted black">' +
                  '<span data-id="' + i + '" style="text-decoration: underline wavy red; cursor: pointer;">' +
                          wrongWord +
                  '</span>' +
                  // eslint-disable-next-line max-len
                  '<div class="dropdownBlock" style="display: none; width: 160px; background-color: white; border-style: solid; border-color: var(--primary); color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1000; bottom: 100%;">' +
                        suggestionsHTML +
                  '</div>' +
                '</div>';

              commentBody.innerHTML = commentBody.innerHTML.substr(0, res.matches[i].offset) +
                replacement + commentBody.innerHTML.substr(res.matches[i].offset + wrongWord.length, commentBody.innerHTML.length);
            }
          }

          setTimeout(() => {
            Array.from(document.getElementsByClassName('markUp')).forEach(markup => {
              markup.addEventListener('click', () => {
                ((markup as HTMLElement).lastChild as HTMLElement).style.display = 'block';
                const rectdiv = (document.getElementById('answer-input')).getBoundingClientRect();
                const rectmarkup = markup.getBoundingClientRect();
                let offset;
                if (rectmarkup.x + rectmarkup.width / 2 > rectdiv.right - 80) {
                  offset = rectdiv.right - rectmarkup.x - rectmarkup.width;
                  ((markup as HTMLElement).lastChild as HTMLElement).style.right = -offset + 'px';
                } else if (rectmarkup.x + rectmarkup.width / 2 < rectdiv.left + 80) {
                  offset = rectmarkup.x - rectdiv.left;
                  ((markup as HTMLElement).lastChild as HTMLElement).style.left = -offset + 'px';
                } else {
                  ((markup as HTMLElement).lastChild as HTMLElement).style.left = '50%';
                  ((markup as HTMLElement).lastChild as HTMLElement).style.marginLeft = '-80px';
                }
                setTimeout(() => {
                  Array.from(document.getElementsByClassName('suggestions')).forEach(suggestion => {
                    suggestion.addEventListener('click', () => {
                      suggestion.parentElement.parentElement.outerHTML = suggestion.innerHTML;
                      this.inputText = commentBody.innerText;
                    });
                  });
                }, 500);
              });
            });
          }, 500);
        });
      }
    }, () => {}, () => {
      this.isSpellchecking = false;
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto' ? wordsCheck.language.detectedLanguage.confidence >= 0.5 : true;
  }
}
