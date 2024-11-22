import { Component, Inject, OnInit } from '@angular/core';
import { SpacyKeyword } from '../../../../services/http/spacy.service';
import { Comment } from '../../../../models/comment';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { KeywordsResultType } from '../../../../utils/keyword-extractor';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

export interface Keyword {
  word: string;
  dep: string[];
  editing: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-spacy-dialog',
  templateUrl: './spacy-dialog.component.html',
  styleUrls: ['./spacy-dialog.component.scss'],
  standalone: false,
})
export class SpacyDialogComponent implements OnInit {
  comment: Comment;
  keywords: Keyword[] = [];
  hasKeywordsFromSpacy = false;
  langSupported: boolean;
  manualKeywords = '';
  customMessage = null;

  constructor(
    public dialogRef: MatDialogRef<SpacyDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data,
  ) {}

  ngOnInit(): void {
    this.comment = this.data.comment;
    const resultKey = this.data.result.resultType;
    this.langSupported = resultKey !== KeywordsResultType.LanguageNotSupported;
    const source = this.comment.keywordsFromSpacy;
    if (resultKey === KeywordsResultType.Failure) {
      this.customMessage = 'spacy-dialog.analysis-error';
      console.error(this.data.result.error);
    } else if (resultKey === KeywordsResultType.BadSpelled) {
      this.customMessage = 'spacy-dialog.analysis-bad-spelled';
    }
    this.hasKeywordsFromSpacy =
      resultKey === KeywordsResultType.Successful && source.length > 0;
    this.keywords = source.map(
      (keyword) =>
        ({
          word: keyword.text,
          dep: [...keyword.dep],
          completed: false,
          editing: false,
          selected: false,
        }) as Keyword,
    );
    this.keywords.sort((a, b) => a.word.localeCompare(b.word));
  }

  createComment() {
    this.comment.keywordsFromQuestioner = this.keywords
      .filter((kw) => kw.selected && kw.word.length)
      .map(
        (kw) =>
          ({
            text: kw.word,
            dep: kw.dep,
          }) as SpacyKeyword,
      );
    this.dialogRef.close({
      comment: this.comment,
    });
  }

  onEdit(keyword: Keyword) {
    keyword.editing = true;
    keyword.selected = false;
  }

  onEndEditing(keyword: Keyword) {
    keyword.editing = false;
    keyword.selected = true;
  }

  selectAll(selected: boolean): void {
    if (selected) {
      this.keywords.forEach((item) => {
        this.onEndEditing(item);
      });
    } else {
      this.keywords.forEach((item) => {
        item.editing = false;
        item.selected = false;
      });
    }
  }

  allKeywordsSelected(): boolean {
    return this.keywords.every((e) => e.selected);
  }

  anyEditing(): boolean {
    return this.keywords.some((e) => e.editing);
  }

  manualKeywordsToKeywords() {
    const tempKeywords = this.manualKeywords.replace(/\s+/g, ' ');
    if (tempKeywords.length) {
      this.keywords = tempKeywords.split(',').map((keyword) => ({
        word: keyword,
        dep: ['ROOT'],
        completed: true,
        editing: false,
        selected: true,
      }));
    } else {
      this.keywords = [];
    }
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.spacy';
  }
}
