import { Component, NgModule, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HeaderComponent } from '../../header/header.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss']
})
export class TopicCloudAdministrationComponent implements OnInit {

  public panelOpenState = false;
  public considerVotes: boolean; // should be in a service
  newKeyword: string = '';
  edit: boolean = false;
  isCreatorOrMod: boolean;
  sortMode: SortMode = SortMode.ALPHABETIC;
  sortModeEnum: typeof SortMode = SortMode; // needed for use in template
  editedKeyword:boolean = false;
  isReadMore: boolean = false;

  keywords: Keyword[] = [
    {
      keywordID: 1,
      keyword: "Cloud",
      questions: [
        "Wie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegung",
        "Wieviel speicherplatz steht mir in der Cloud zur verfuegung?",
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
  }

  deleteKeyword(id: number): void{
    this.keywords.map(keyword => {
      if (keyword.keywordID == id)
          this.keywords.splice(this.keywords.indexOf(keyword, 0), 1);
    });
    if (this.keywords.length == 0) {
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
          keyword.keyword = this.newKeyword;
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

  showText() {
     this.isReadMore = !this.isReadMore;
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