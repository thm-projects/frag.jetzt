import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { TopicCloudAdminData } from './TopicCloudAdminData';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss']
})
export class TopicCloudAdministrationComponent implements OnInit, OnDestroy {
  public panelOpenState = false;
  public considerVotes: boolean;
  public profanityFilter: boolean;
  public hideBlacklist: boolean;
  newKeyword = undefined;
  edit = false;
  isCreatorOrMod: boolean;
  enterBadword = false;
  enterBlacklistWord = false;
  newBadWord: string = undefined;
  newBlacklistWord: string = undefined;
  sortMode = 'alphabetic';
  searchedKeyword = undefined;
  searchMode = false;
  filteredKeywords: Keyword[] = [];
  showBadWordList = false;
  showBlacklistWordList = false;
  showSettingsPanel = false;
  userRole: UserRole;
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
        'Türkisch: Orospu çocuğu!',
        'Arabisch: عاهرة!',
        'Multi language: Ficken, Fuck, con',
        'Custom: Nieder mit KQC'
      ]
    },
  ];
  private topicCloudAdminData: TopicCloudAdminData;

  constructor(public cloudDialogRef: MatDialogRef<TagCloudComponent>,
    public confirmDialog: MatDialog,
    private notificationService: NotificationService,
    private authenticationService: AuthenticationService,
    private translateService: TranslateService,
    private langService: LanguageService,
    private route: ActivatedRoute,
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
      this.setDefaultAdminData();
    }

  ngOnDestroy(){
    this.setAdminData();
  }

  setAdminData(){
    this.topicCloudAdminData = {
      blackList: this.topicCloudAdminService.getBlacklistWords(this.profanityFilter, this.hideBlacklist),
      considerVotes: this.considerVotes,
      profanityFilter: this.profanityFilter,
      hideBlacklist: this.hideBlacklist
    };
    this.topicCloudAdminService.setAdminData(this.topicCloudAdminData);
  }

  setDefaultAdminData() {
    this.topicCloudAdminData = this.topicCloudAdminService.getAdminData;
    if (this.topicCloudAdminData) {
      this.considerVotes = this.topicCloudAdminData.considerVotes;
      this.profanityFilter = this.topicCloudAdminData.profanityFilter;
      this.hideBlacklist = this.topicCloudAdminData.hideBlacklist;
    }
  }

  getKeywordWithoutProfanity(keyword: string): string {
    return this.topicCloudAdminService.filterProfanityWords(keyword);
  }

  getBadWordList() {
    return this.topicCloudAdminService.getBadWordList();
  }

  getBlacklist() {
    return this.topicCloudAdminService.getBlacklistWordList();
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
    for (const keyword of this.keywords){
      if (keyword.keywordID === key.keywordID) {
        const key2 = this.checkIfKeywordExists(this.newKeyword.trim().toLowerCase());
        if (key2){
          this.openConfirmDialog(keyword, key2, 'merge-message', 'merge');
        } else {
          keyword.keyword = this.newKeyword.trim();
        }
        break;
      }
    }
    this.edit = false;
    this.newKeyword = undefined;
    this.sortQuestions();
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  openConfirmDialog(keyword: Keyword, key2: Keyword, msg: string, _confirmLabel: string) {
    const translationPart = 'topic-cloud-confirm-dialog.'+msg;
    const confirmDialogRef = this.confirmDialog.open(TopicCloudConfirmDialogComponent, {
      data: {topic: keyword.keyword, message: translationPart, confirmLabel: _confirmLabel}
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.deleteKeyword(keyword);
      } else if (result === 'merge') {
        this.mergeKeywords(keyword, key2);
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

  mergeKeywords(key1: Keyword, key2: Keyword) {
    if (key1 !== undefined && key2 !== undefined){
      key1.questions.map(question => {
        key2.questions.push(question);
      });
      this.deleteKeyword(key1);
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

  focusInput(id: string) {
    setTimeout(() => {
      document.getElementById(id).focus();
    }, 100);
  }

  addBadword() {
    this.topicCloudAdminService.addToBadWordList(this.newBadWord);
    this.newBadWord = undefined;
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  addBlacklistWord() {
    this.topicCloudAdminService.addToBlacklistWordList(this.newBlacklistWord);
    this.newBlacklistWord = undefined;
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  removeWordFromBadWords(word: string) {
    this.topicCloudAdminService.removeFromBadWordList(word);
  }

  removeWordFromBlacklist(word: string) {
    this.topicCloudAdminService.removeWordFromBlacklist(word);
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
