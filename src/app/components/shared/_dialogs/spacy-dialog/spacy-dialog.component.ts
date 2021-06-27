import {AfterContentInit, Component, Inject, OnInit, ViewChild} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CreateCommentComponent } from '../create-comment/create-comment.component';
import { SpacyService, Model } from '../../../../services/http/spacy.service';
import { LanguagetoolService } from '../../../../services/http/languagetool.service';
import { Comment } from '../../../../models/comment';
import { map } from 'rxjs/operators';
import {DialogActionButtonsComponent} from "../../dialog/dialog-action-buttons/dialog-action-buttons.component";

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

  @ViewChild('appDialogActionButtons') appDialogActionButtons: DialogActionButtonsComponent;

  comment: Comment;
  commentLang: Model;
  commentBodyChecked: string;
  keywords: Keyword[] = [];
  keywordsOriginal: Keyword[] = [];
  isLoading = false;
  langSupported: boolean;
  manualKeywords = '';
  _concurrentEdits = 0

  constructor(
    protected langService: LanguagetoolService,
    private spacyService: SpacyService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
  }

  ngOnInit(): void {
    this.comment = this.data.comment;
    this.commentLang = this.data.commentLang;
    this.commentBodyChecked = this.data.commentBodyChecked;
    this.langSupported = this.langService.isSupportedLanguage(this.data.commentLang);
  }

  ngAfterContentInit(): void {
    if (this.langSupported) {
      this.evalInput(this.commentLang);
    }
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildCreateCommentActionCallback() {
    return () => {
      this.comment.keywordsFromQuestioner = this.keywords.filter(kw => kw.selected && kw.word.length).map(kw => kw.word);
      this.comment.keywordsFromSpacy = this.keywordsOriginal.filter(kw => kw.word.length).map(kw => kw.word);
      this.dialogRef.close(this.comment);
    };
  }

  evalInput(model: Model) {
    this.isLoading = true;

    // N at first pos = all Nouns(NN de/en) including singular(NN, NNP en), plural (NNPS, NNS en), proper Noun(NNE, NE de)
    this.spacyService.getKeywords(this.commentBodyChecked, model)
      .pipe(
        map(keywords => keywords.map(keyword => ({
          word: keyword,
          completed: false,
          editing: false,
          selected: false
        } as Keyword)))
      )
      .subscribe(words => {
        this.keywords = words;
        //deep copy
        this.keywordsOriginal = [...words];
        for (let i = 0; i < this.keywordsOriginal.length; i++) {
          this.keywordsOriginal[i] = {...this.keywordsOriginal[i]};
        }
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

  allKeywordsSelected(): boolean {
    for (const kw of this.keywords) {
      if (!kw.selected) {
        return false;
      }
    }
    return true;
  }

  manualKeywordsToKeywords() {
    const tempKeywords = this.manualKeywords.replace(/\s/g, '');
    if (tempKeywords.length) {
      this.keywords = tempKeywords.split(',').map((keyword) => (
        {
          word: keyword,
          completed: true,
          editing: false,
          selected: true
        }
      ));
    } else {
      this.keywords = [];
    }
  }

  onEditChange(change: number) {
    this._concurrentEdits += change;
    this.appDialogActionButtons.confirmButtonDisabled = (this._concurrentEdits > 0)
  }
}
