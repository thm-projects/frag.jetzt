import { AfterContentInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SpacyService, SpacyKeyword } from '../../../../services/http/spacy.service';
import { LanguagetoolService } from '../../../../services/http/languagetool.service';
import { Comment } from '../../../../models/comment';
import { DialogActionButtonsComponent } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { Model } from '../../../../services/http/spacy.interface';

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
export class SpacyDialogComponent implements OnInit, AfterContentInit {

  @ViewChild('appDialogActionButtons') appDialogActionButtons: DialogActionButtonsComponent;

  comment: Comment;
  commentLang: Model;
  commentBodyChecked: string;
  keywords: Keyword[] = [];
  keywordsOriginal: SpacyKeyword[] = [];
  hasKeywordsFromSpacy = false;
  isLoading = false;
  langSupported: boolean;
  manualKeywords = '';
  _concurrentEdits = 0;

  constructor(
    protected langService: LanguagetoolService,
    private spacyService: SpacyService,
    public dialogRef: MatDialogRef<SpacyDialogComponent>,
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
      this.comment.keywordsFromQuestioner = this.keywords.filter(kw => kw.selected && kw.word.length).map(kw => ({
        lemma: kw.word,
        dep: kw.dep
      } as SpacyKeyword));
      this.comment.keywordsFromSpacy = this.keywordsOriginal;
      this.dialogRef.close(this.comment);
    };
  }

  evalInput(model: Model) {
    this.isLoading = true;

    // N at first pos = all Nouns(NN de/en) including singular(NN, NNP en), plural (NNPS, NNS en), proper Noun(NNE, NE de)
    this.spacyService.getKeywords(this.commentBodyChecked, model)
      .subscribe(words => {
        this.keywordsOriginal = words;
        this.keywords = words.map(keyword => ({
          word: keyword.lemma,
          dep: [...keyword.dep],
          completed: false,
          editing: false,
          selected: false
        } as Keyword));
        this.keywords.sort((a, b) => a.word.localeCompare(b.word));
        this.hasKeywordsFromSpacy = this.keywords.length > 0;
      }, () => {
        this.keywords = [];
        this.keywordsOriginal = [];
        this.hasKeywordsFromSpacy = false;
        this.isLoading = false;
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
}
