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
    this.checkSpellings(comment.body).subscribe((res) => {
      let commentBodyChecked = comment.body;
      const commentLang = this.languagetoolService.mapLanguageToSpacyModel(res.language.code);
      for(let i = res.matches.length - 1; i >= 0; i--){
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
    // Cut the text down to 500 or 1000 chars depending on the user role.
    if(this.user.role === 3 && commentBody.innerText.length > 1000) {
      commentBody.innerText = commentBody.innerText.slice(0, 1000);
    } else if(this.user.role !== 3 && commentBody.innerText.length > 500){
      commentBody.innerText = commentBody.innerText.slice(0, 500);
    }
  }

  grammarCheck(commentBody: HTMLDivElement): void {
    let wrongWords: string[] = [];
    this.checkSpellings(commentBody.innerText).subscribe((wordsCheck) => {
      if(wordsCheck.matches.length > 0 ) {
        wordsCheck.matches.forEach(grammarError => {
          const wrongWord = commentBody.innerText.slice(grammarError.offset, grammarError.offset + grammarError.length);
          wrongWords.push(wrongWord);
        });
        this.checkSpellings(commentBody.innerHTML).subscribe((res) => {
          for(let i = res.matches.length - 1; i >= 0; i--){ // Reverse for loop to make sure the offset is right.
            const wrongWord = commentBody.innerHTML
              .slice(res.matches[i].offset, res.matches[i].offset + res.matches[i].length);

            if (wrongWords.includes(wrongWord)) { // Only replace the real Words, excluding the HTML tags
              const msg = res.matches[i].message; // The explanation of the suggestion for improvement
              const suggestions = res.matches[i].replacements; // The suggestions for improvement. Access: suggestions[x].value
              const replacement = '<span style="text-decoration: underline wavy red">'  // set the Styling for all marked words
                // Select menu with suggestions has to be injected here.
                + wrongWord +
                '</span>';
              commentBody.innerHTML = commentBody.innerHTML.substr(0, res.matches[i].offset) +
                replacement +
                commentBody.innerHTML.substr(res.matches[i].offset + wrongWord.length,
                  commentBody.innerHTML.length);
            }
          }
        });
      }
    });
  }
}
