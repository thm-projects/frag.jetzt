import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { FormControl } from '@angular/forms';
import { SpacyService } from '../../../../services/http/spacy.service';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';

@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss']
})
export class TopicCloudAdministrationComponent implements OnInit {
  public panelOpenState = false;
  public considerVotes: boolean; // should be sent back to tagCloud component
  public profanityFilter = true;
  newKeyword = undefined;
  edit = false;
  isCreatorOrMod: boolean;
  enterBadword = false;
  newBadWord: string = undefined;

  sortMode = 'alphabetic';
  searchedKeyword = undefined;
  searchMode = false;
  filteredKeywords: Keyword[] = [];
  model = new FormControl('');
  output: any | undefined;
  isenddKeyword= true;

  keywords: Keyword[] = [
    {
      keywordID: 1,
      keyword: 'Cloud',
      questions: [
        'Wieviel speicherplatz steht mir in der Cloud zur verfügung?',
        'Sollen wir die Tag Cloud implementieren?',
        // eslint-disable-next-line max-len
        'Wie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegungWie genau ist die Cloud aufgebaut? Wieviel speicherplatz steht mir in der Cloud zur verfuegung',
      ]
    },
    {
      keywordID: 2,
      keyword: 'SWT',
      questions: [
        'Muss man fuer das Modul SWT bestanden haben?'
      ]
    },
    {
      keywordID: 3,
      keyword: 'Frage',
      questions: [
        'Das ist eine Lange Frage mit dem Thema \'frage\'',
        'Ich habe eine Frage, sind Fragen zum thema \'Frage\' auch erlaubt?',
        'Ich wollte Fragen ob sie gerne Sachen gefragt werden',
        'Langsam geht mir die Fragerei mit den ganzen Fragen auf den Geist Frage'
      ]
    },
    {
      keywordID: 4,
      keyword: 'Klausur',
      questions: [
        'Darf man in der Klausur hilfmittel verwenden?',
        'An welchem Termin findet die Klausur statt?'
      ]
    },
    {
      keywordID: 5,
      keyword: 'Diskrete Math',
      questions: [
        'wann wird die nächste veranstaltung stattfinden?',
        'gibt es heute übung?'
      ]
    },
    {
      keywordID: 6,
      keyword: 'Arsch',
      questions: [
        'Das ist eine Testfrage fuer den Profanity Filter, du Arschloch',
        'Englisch: Fuck you!',
        'Deutsch: Fick dich!',
        'Französisch: Gros con!',
        'Multi language: Ficken, Fuck, con',
        'Custom: Nieder mit KQC'
      ]
    },

  ];

  getKeywordWithoutProfanity(keyword: string): string {
    return this.topicCloudAdminService.filterProfanityWords(keyword);
  }

  constructor(public cloudDialogRef: MatDialogRef<TagCloudComponent>,
              public confirmDialog: MatDialog,
              private notificationService: NotificationService,
              private authenticationService: AuthenticationService,
              private translateService: TranslateService,
              private spacyService: SpacyService,
              private langService: LanguageService,
              private topicCloudAdminService: TopicCloudAdminService) {

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

  sortQuestions(sortMode?: string) {
    if (sortMode !== undefined) {
      this.sortMode = sortMode;
    }

    switch (this.sortMode) {
      case 'alphabetic':
        this.keywords.sort((a, b) => a.keyword.localeCompare(b.keyword));
        break;
      case 'questionsCount':
        this.keywords.sort((a, b) => b.questions.length - a.questions.length);
        break;
      case 'voteCount':
        console.log('not implemented!, sorting with question count');
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
    if (this.keywords.length === 0){
      this.translateService.get('topic-cloud-dialog.nokeyword-note').subscribe(msg => {
        this.notificationService.show(msg);
      });
      this.cloudDialogRef.close();
    }
  }

  editKeyword(index: number): void {
    this.edit = true;

    setTimeout(() => {
      document.getElementById('edit-input'+ index).focus();
    }, 0);
  }

  deleteKeyword(key: Keyword): void{
    this.keywords.map(keyword => {
      if (keyword.keywordID === key.keywordID) {
          this.keywords.splice(this.keywords.indexOf(keyword, 0), 1);
      }
    });
    if (this.keywords.length === 0) {
      this.cloudDialogRef.close();
    }
    if (this.searchMode === true){
      /* update filtered array if it is searchmode */
      this.searchKeyword();
    }
  }

  cancelEdit(): void {
    this.edit = false;
    this.newKeyword = undefined;
  }

  confirmEdit(key: Keyword): void {
    this.keywords.map(keyword => {
      if (keyword.keywordID === key.keywordID) {
          this.integrateIfKeywordExists(keyword, this.newKeyword.trim().toLowerCase());
          keyword.keyword = this.newKeyword.trim();
      }
    });
    this.edit = false;
    this.newKeyword = undefined;
    this.sortQuestions();
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  openConfirmDialog(keyword: Keyword): void {
    const confirmDialogRef = this.confirmDialog.open(TopicCloudConfirmDialogComponent, {
      data: {topic: keyword.keyword}
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.deleteKeyword(keyword);
        this.isenddKeyword= false;
      }
    });
  }

  searchKeyword(): void {
    if (!this.searchedKeyword){
      this.searchMode = false;
    } else {
      this.filteredKeywords = this.keywords.filter(keyword =>
        keyword.keyword.toLowerCase().includes(this.searchedKeyword.toLowerCase())
      );
      this.searchMode = true;
    }
  }

  //TODO: confirm dialog -> keyword does already exist, do you want to merge the questions with the existing keyword?

  integrateIfKeywordExists(keyword: Keyword, keyname: string) {
    const key = this.checkIfKeywordExists(keyname);
    if (key !== undefined){
      key.questions.map(question => {
        keyword.questions.push(question);
      });
      this.deleteKeyword(key);
    }
  }

  checkIfKeywordExists(key: string): Keyword {
    for(const keyword of this.keywords){
      if(keyword.keyword.toLowerCase() === key){
        return keyword;
      }
    }
    return undefined;
  }

  focusBadWordInput() {
    setTimeout(() => {
      document.getElementById('bad-word-input').focus();
    }, 100);
  }
  
  addBadword() {
    this.topicCloudAdminService.addToBadwordList(this.newBadWord);
    this.newBadWord = undefined;
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  refreshAllLists(){
    this.searchKeyword();
  }
}

interface Keyword {
  keywordID: number;
  keyword: string;
  questions: string[];
}
