import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SpacyKeyword } from '../../../../services/http/spacy.service';
import { Comment } from '../../../../models/comment';
import { DialogActionButtonsComponent } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { KeywordsResultType } from '../../../../utils/create-comment-keywords';

export interface Keyword {
  word: string;
  dep: string[];
  completed: boolean;
  editing: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-spacy-dialog',
  templateUrl: './spacy-dialog.component.html',
  styleUrls: ['./spacy-dialog.component.scss']
})
export class SpacyDialogComponent implements OnInit {

  @ViewChild('appDialogActionButtons') appDialogActionButtons: DialogActionButtonsComponent;

  comment: Comment;
  keywords: Keyword[] = [];
  hasKeywordsFromSpacy = false;
  langSupported: boolean;
  manualKeywords = '';
  _concurrentEdits = 0;

  constructor(
    public dialogRef: MatDialogRef<SpacyDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data
  ) {
  }

  ngOnInit(): void {
    this.comment = this.data.comment;
    this.langSupported = this.data.result !== KeywordsResultType.languageNotSupported;
    const source = this.data?.isAnswer ? this.comment.answerFulltextKeywords : this.comment.keywordsFromSpacy;
    this.hasKeywordsFromSpacy = this.data.result === KeywordsResultType.successful && source.length > 0;
    this.keywords = source.map(keyword => ({
      word: keyword.text,
      dep: [...keyword.dep],
      completed: false,
      editing: false,
      selected: false
    } as Keyword));
    this.keywords.sort((a, b) => a.word.localeCompare(b.word));
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildCreateCommentActionCallback() {
    return () => {
      const questioner = this.keywords.filter(kw => kw.selected && kw.word.length).map(kw => ({
        text: kw.word,
        dep: kw.dep
      } as SpacyKeyword));
      if (this.data?.isAnswer) {
        this.comment.answerQuestionerKeywords = questioner;
      } else {
        this.comment.keywordsFromQuestioner = questioner;
      }
      this.dialogRef.close(this.comment);
    };
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
    const tempKeywords = this.manualKeywords.replace(/\s+/g, ' ');
    if (tempKeywords.length) {
      this.keywords = tempKeywords.split(',').map((keyword) => (
        {
          word: keyword,
          dep: ['ROOT'],
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
    this.appDialogActionButtons.confirmButtonDisabled = (this._concurrentEdits > 0);
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.spacy';
  }
}
