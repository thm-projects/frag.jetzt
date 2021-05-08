import { AfterContentInit, Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatSelectionListChange } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateCommentComponent } from '../create-comment/create-comment.component';

import { SpacyService } from '../../../../services/http/spacy.service';
import { LanguageService } from '../../../../services/util/language.service';
import { Comment } from '../../../../models/comment';

export interface Keyword {
  word: string;
  completed: boolean;
  editing: boolean;
}
@Component({
  selector: 'app-spacy-dialog',
  templateUrl: './spacy-dialog.component.html',
  styleUrls: ['./spacy-dialog.component.scss']
})
export class SpacyDialogComponent implements OnInit, AfterContentInit {

  commentlang = [
    { lang: 'de' },
    { lang: 'en' },
    { lang: 'fr' },
  ];
  selectedLang = localStorage.getItem('currentLang');

  comment: Comment;
  evalWords: string[];
  keywords: Keyword[] = [];

  selection = new SelectionModel(true);

  constructor(
    private translateService: TranslateService,
    protected langService: LanguageService,
    private spacyService: SpacyService,
    public dialogRef: MatDialogRef<CreateCommentComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit(): void {
    this.comment = this.data.comment;
  }

  ngAfterContentInit(): void {
    this.evalInput(this.selectedLang);
  }

  onSelectionChange(selection: MatSelectionListChange) {
    selection.option.selected
      ? this.selection.select(selection.option.value)
      : this.selection.deselect(selection.option.value);
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
   buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildCreateCommentActionCallback() {
    return () => {
      this.comment.keywords = this.keywords.map(kw => kw.word);
      this.dialogRef.close(this.comment);
    };
  }

  evalInput(model: string) {
    this.keywords = [];
    const words: Keyword[] = [];

    // N at first pos = all Nouns(NN de/en) including singular(NN, NNP en), plural (NNPS, NNS en), proper Noun(NNE, NE de)
    this.spacyService.analyse(this.comment.body, model)
      .subscribe(res => {
        for(const word of res.words) {
          if (word.tag.charAt(0) === 'N')
            words.push({
              word: word.text,
              completed: false,
              editing: false
            });
        }
        this.keywords = words;
      });
  }

  onEdit(keyword){
    keyword.editing = true;
  }

  onEndEditing(keyword){
    keyword.editing = false;
    keyword.completed = true;
  }

  selectAll( selected:boolean): void {
    if (selected) {
      this.keywords.forEach(item => {
        this.onEndEditing(item);
      });
    } else {
      this.keywords.forEach(item => {
        item.editing = false;
        item.completed = false;
      });
    }
  }

}
