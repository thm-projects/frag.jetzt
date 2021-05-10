import { Component, NgModule, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HeaderComponent } from '../../header/header.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import {FormControl} from "@angular/forms";
import { SearchFilterPipe } from '../../../../pipe/search-filter.pipe';
import { EventService } from '../../../../services/util/event.service';
import {startWith, map, filter} from 'rxjs/operators';
import {BehaviorSubject, Observable} from "rxjs";



@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss']
})
export class TopicCloudAdministrationComponent implements OnInit {
  // @ViewChildren("keywordInput") keywordInput: QueryList<ElementRef>;
  public panelOpenState = false;
  public considerVotes: boolean; // should be sent back to tagCloud component
  public tagsLowerCase: boolean; // should be sent back to tagCloud component
  newKeyword: string = '';
  edit: boolean = false;
  isCreatorOrMod: boolean;
  sortMode: SortMode = SortMode.ALPHABETIC;
  sortModeEnum: typeof SortMode = SortMode; // needed for use in template
  editedKeyword:boolean = false;

  keywordsSubject: BehaviorSubject<Keyword[]> = new BehaviorSubject<Keyword[]>([]);

  // public searchFilter: any = '';

  control=new FormControl();
  searchInput = '';
  search = false;
  hideKeyWordList=true;
  newkey:Keyword[];


  searchPlaceholder = '';






  keywords: Keyword[] = [
    {
      keywordID: 1,
      keyword: "Cloud",
      questions: [
        "Wie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegung",
        "Wieviel speicherplatz steht mir in der Cloud zur verfuegung? Ich habe eine Frage, sind Fragen zum thema 'Frage' auch erlaubt?",
        "Sollen wir die Tag Cloud implementieren?"
      ]
    },
    {
      keywordID: 2,
      keyword: "SWT",
      questions: [
        "Muss man fuer das Modul SWT bestanden haben?"
      ]
    },
    {
      keywordID: 3,
      keyword: "Frage",
      questions: [
        "Das ist eine Lange Frage mit dem Thema 'frage'",
        "Ich habe eine Frage, sind Fragen zum thema 'Frage' auch erlaubt?",
        "Ich wollte Fragen ob sie gerne Sachen gefragt werden",
        "Langsam geht mir die Fragerei mit den ganzen Fragen auf den Geist"
      ]
    },
    {
      keywordID: 4,
      keyword: "Klausur",
      questions: [
        "Darf man in der Klausur hilfmittel verwenden?",
        "An welchem Termin findet die Klausur statt?"
      ]
    },
    {
      keywordID: 5,
      keyword: "AA",
      questions: [
        "Darf man in der Klausur hilfmittel verwenden?",
        "An welchem Termin findet die Klausur statt?"
      ]
    },
    {
      keywordID: 6,
      keyword: "ZZ",
      questions: [
        "Darf man in der Klausur hilfmittel verwenden?",
        "An welchem Termin findet die Klausur statt?"
      ]
    },
    {
      keywordID: 7,
      keyword: "MM",
      questions: [
        "Darf man in der Klausur hilfmittel verwenden?",
        "An welchem Termin findet die Klausur statt?"
      ]
    },
    {
      keywordID: 8,
      keyword: "Diskrete Math",
      questions: [
        "wann wird die nächste veranstaltung stattfinden?",
        "gibt es heute übung?"
      ]
    },

  ];


  constructor(public cloudDialogRef: MatDialogRef<HeaderComponent>,
              public confirmDialog: MatDialog,
              private notificationService: NotificationService,
              private authenticationService: AuthenticationService,
              private translateService: TranslateService,
              private langService: LanguageService) {

                this.langService.langEmitter.subscribe(lang => {
                  this.translateService.use(lang);
                });
              }

  ngOnInit(): void {
    this.keywordsSubject.next(this.keywords);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.checkIfUserIsModOrCreator();
    this.checkIfThereAreQuestions();
    this.sortQuestions();
  }


  sortQuestions(sortMode?: SortMode) {
    if (sortMode !== undefined) {
      this.sortMode = sortMode;
    }

    switch (this.sortMode) {
      case SortMode.ALPHABETIC:
        this.keywords.sort((a, b) => a.keyword.localeCompare(b.keyword));
        break;
      case SortMode.QUESTIONSCOUNT:
        this.keywords.sort((a, b) => b.questions.length - a.questions.length);
        break;
    }
  }

  checkIfUserIsModOrCreator() {
    this.isCreatorOrMod = this.authenticationService.getRole() === UserRole.CREATOR ||
                          this.authenticationService.getRole() === UserRole.EDITING_MODERATOR ||
                          this.authenticationService.getRole() === UserRole.EXECUTIVE_MODERATOR;
  }

  checkIfThereAreQuestions() {
    if (this.keywords.length == 0){
      this.translateService.get('topic-cloud-dialog.nokeyword-note').subscribe(msg => {
        this.notificationService.show(msg);
      });
      this.cloudDialogRef.close();
    }
  }

  pushToArray(id: number, key: string, questions: string[]){
    let _keyword = {
      keywordID: id,
      keyword: key,
          questions: questions
      }
    this.keywords.push(_keyword);
  }

  editKeyword(): void {
    this.edit = true;

    // focus on input currently trows exception

    // this.keywordInput.changes.subscribe(() => {
    //   if (this.keywordInput.first.nativeElement && this.edit) {
    //     this.keywordInput.first.nativeElement.focus();
    //   }
    // });
  }

  deleteKeyword(id: number): void{


    this.keywords.map(keyword => {
      if (keyword.keywordID == id) {
        console.log("before" , this.keywords);
        //console.log( this.keywords.splice(this.keywords.indexOf(keyword, 0), 1));
        this.keywords.splice(this.keywords.indexOf(keyword, 0), 1);
        console.log("after" , this.keywords);

      }
    });
    if (this.keywords.length == 0) {
      //console.log(this.cloudDialogRef.close());
    //  this.keywords=this.newkey;
      this.cloudDialogRef.close();
    }
  }

  cancelEdit(): void {
    this.edit = false;
    this.newKeyword = '';
  }

  confirmEdit(id: number): void {
    this.keywords.map(keyword => {
      if (keyword.keywordID == id)
          keyword.keyword = this.newKeyword.trim();
    });
    this.edit = false;
    this.editedKeyword = true;
    this.newKeyword = '';
    this.sortQuestions();
  }

  openConfirmDialog(keyword: Keyword): void {
    const confirmDialogRef = this.confirmDialog.open(TopicCloudConfirmDialogComponent, {
      data: {topic: keyword.keyword}
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result == true) {
        this.deleteKeyword(keyword.keywordID);
      }
    })
  }
  searchComments(): void {
    this.search = true;
    if (this.searchInput) {
      if (this.searchInput.length > 1) {
        for (let keyword of this.keywords) {

         this.keywords= this.keywords
            .filter(c => this.checkIfIncludesKeyWord(c.keyword, this.searchInput));
        }
      } else if (this.searchInput.length === 0 ) {
        this.hideKeyWordList = false;
      }
    }
  }

  checkIfIncludesKeyWord(body: string, keyword: string) {
    return body.toLowerCase().includes(keyword.toLowerCase());
  }

  private _filter(value: string): Keyword[] {
    const filterValue = this._normalizeValue(value);

    return this.keywords.filter(key => this._normalizeValue(key.keyword).includes(filterValue));
  }

  private _normalizeValue(value: string): string {

    return value.toLowerCase().replace(/\s/g, '');
  }
}

export enum SortMode {
  ALPHABETIC,
  QUESTIONSCOUNT
}

interface Keyword {
  keywordID: number;
  keyword: string;
  questions: string[];
}
