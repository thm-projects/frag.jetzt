import { AfterContentInit, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CreateCommentComponent } from '../create-comment/create-comment.component';
import { SpacyService, Model } from '../../../../services/http/spacy.service';
import { LanguageService } from '../../../../services/util/language.service';
import { Comment } from '../../../../models/comment';

export interface Keyword {
  word: string;
  completed: boolean;
  editing: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-spacy-dialog',
  templateUrl: './spacy-dialog.component.html',
  styleUrls: ['./spacy-dialog.component.scss']
})
export class SpacyDialogComponent implements OnInit, AfterContentInit {

  comment: Comment;
  commentLang: Model;
  commentBodyChecked: string;
  keywords: Keyword[] = [];
  keywordsOriginal: Keyword[] = [];
  isLoading = false;

  constructor(
    protected langService: LanguageService,
    private spacyService: SpacyService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
  }

  ngOnInit(): void {
    this.comment = this.data.comment;
    this.commentLang = this.data.commentLang;
    this.commentBodyChecked = this.data.commentBodyChecked;
  }

  ngAfterContentInit(): void {
    this.evalInput(this.commentLang);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildCreateCommentActionCallback() {
    return () => {
      this.comment.keywordsFromQuestioner = this.keywords.filter(kw => kw.selected).map(kw => kw.word);
      this.comment.keywordsFromSpacy = this.keywordsOriginal.map(kw => kw.word);
      this.dialogRef.close(this.comment);
    };
  }

  evalInput(model: Model) {
    const keywords: Keyword[] = [];
    let regex;
    if(this.commentLang === 'de') {
      regex = new RegExp('(?!Der|Die|Das)[A-ZAÄÖÜ][a-zäöüß]+(-[A-Z][a-zäöüß]+)*', 'g');
    } else if (this.commentLang === 'en') {
      regex = new RegExp('(?!he|she|it|for|with)[a-z]{2,}(-[a-z]{2,})*', 'gi');
    } else {
      regex = new RegExp('(?!au|de|la|le|en|un)[A-ZÀ-Ÿ]{2,}', 'gi');
    }

    this.isLoading = true;

    // N at first pos = all Nouns(NN de/en) including singular(NN, NNP en), plural (NNPS, NNS en), proper Noun(NNE, NE de)
    this.spacyService.getKeywords(this.commentBodyChecked, model)
      .subscribe(words => {
        for(const word of words) {
          const filteredwords = word.match(regex) || [];
          for (const filteredword of filteredwords) {
            if(filteredword !== null && filteredword !== undefined && keywords.filter(item => item.word === filteredword).length < 1) {
              keywords.push({
                word: filteredword,
                completed: false,
                editing: false,
                selected: false
              });
            }
          }
        }
        this.keywords = keywords;
        this.keywordsOriginal = keywords;
      }, () => {
        this.keywords = [];
        this.keywordsOriginal = [];
      }, () => {
        this.isLoading = false;
      });
  }

  onEdit(keyword) {
    keyword.editing = true;
    keyword.completed = false;
    keyword.selected = false;
  }

  onEndEditing(keyword) {
    keyword.editing = false;
    keyword.completed = true;
    keyword.selected = true;
  }

  selectAll(selected: boolean): void {
    if (selected) {
      this.keywords.forEach(item => {
        this.onEndEditing(item);
      });
    } else {
      this.keywords.forEach(item => {
        item.editing = false;
        item.completed = false;
        item.selected = false;
      });
    }
  }
}
