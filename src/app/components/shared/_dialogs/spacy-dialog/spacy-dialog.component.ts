import { AfterContentInit, Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { HttpClient } from '@angular/common/http';
import { MatSelectionListChange } from '@angular/material/list';
import { SelectionModel } from '@angular/cdk/collections';

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

  test;
  keywords: Keyword[] = [];
  selection = new SelectionModel(true);
  constructor(private translateService: TranslateService, protected langService: LanguageService, private client: HttpClient) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }
  ngOnInit(): void {
  }
  ngAfterContentInit(): void {
    this.addKeywords();
  }
  onSelectionChange(selection: MatSelectionListChange) {
    selection.option.selected
      ? this.selection.select(selection.option.value)
      : this.selection.deselect(selection.option.value);
  }
  addKeywords() {
    this.test = Array.from({ length: 250 }).map((_, i) => `Item #${i}`);
    this.test.keys();
    console.log(this.test);
  }
  /*
  testInput(): void {
    console.log(this.evalInput('Wieviel Aufgaben gibt es in der Klausur?', 'de'));
  }
   */

  onCancel() {

  }

  onSubmit() {

  }

  evalInput(input: string, model: string): string[] {
    const filterTag = 'N';
    let spacyData: any = [];
    const words: string[] = [];
    const body = '{"text": "' + input + '", "model": "' + model + '"}';
    this.client.post('https://spacy.frag.jetzt/dep', body).subscribe(data => {
      spacyData = data;
      // filter for tags in words (all Nouns)
      for ( const word of spacyData.words ) {
        // N at first pos = all Nouns(NN de/en) including singular(NN, NNP en), plural (NNPS, NNS en), proper Noun(NNE, NE de)
        if (word.tag.charAt(0).includes(filterTag)) {
          words.push(word.text);
        }
      }
    });
    return words;
  }

}
