import { AfterContentInit, Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { HttpClient } from '@angular/common/http';
import { MatSelectionListChange } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateCommentComponent } from '../create-comment/create-comment.component';

import { Comment } from '../../../../models/comment';

export interface Keyword {
  word: string;
  completed: boolean;
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
    private client: HttpClient,
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
      this.comment.keywords = this.evalWords.join(',');
      this.dialogRef.close(this.comment);
    };
  }

  evalInput( model: string) {
    const filterTag = 'N';
    const words: string[] = [];
    this.evalWords = [];

    this.client.post(
        'https://spacy.frag.jetzt/dep',
        JSON.stringify({text: this.comment.body, model})
      ).subscribe((data: any) => {
      // filter for tags in words (all Nouns)
      for (const word of data.words) {
        // N at first pos = all Nouns(NN de/en) including singular(NN, NNP en), plural (NNPS, NNS en), proper Noun(NNE, NE de)
        if (word.tag.charAt(0).includes(filterTag)) {
          words.push(word.text);
        }
      }
      this.evalWords = words;
    });
  }
}
