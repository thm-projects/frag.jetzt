import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { TopicCloudAdminData, Labels, spacyLabels } from './TopicCloudAdminData';
import { KeywordOrFulltext } from './TopicCloudAdminData';
import { User } from '../../../../models/user';
import { CommentService } from '../../../../services/http/comment.service';
import { WsCommentServiceService } from '../../../../services/websockets/ws-comment-service.service';
import * as internal from 'assert';

@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss']
})
export class TopicCloudAdministrationComponent implements OnInit, OnDestroy {
  public panelOpenState = false;
  public considerVotes: boolean;
  public profanityFilter: boolean;
  public blacklistIsActive: boolean;
  blacklist: string[] = [];
  blacklistSubscription = undefined;
  keywordOrFulltextENUM = KeywordOrFulltext;
  newKeyword = undefined;
  edit = false;
  isCreatorOrMod: boolean;
  enterProfanityWord = false;
  enterBlacklistWord = false;
  newProfanityWord: string = undefined;
  newBlacklistWord: string = undefined;
  sortMode = 'alphabetic';
  searchedKeyword = undefined;
  searchMode = false;
  filteredKeywords: Keyword[] = [];
  showProfanityList = false;
  showBlacklistWordList = false;
  showSettingsPanel = false;
  keywordORfulltext: string = undefined;
  userRole: UserRole;

  wantedLabels: Labels;
  englishLabels = true;
  germanLabels = true;

  keywords: Keyword[] = [];
  private topicCloudAdminData: TopicCloudAdminData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    public cloudDialogRef: MatDialogRef<TopicCloudAdministrationComponent>,
    public confirmDialog: MatDialog,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private langService: LanguageService,
    private topicCloudAdminService: TopicCloudAdminService,
    private commentService: CommentService,
    private wsCommentServiceService: WsCommentServiceService) {
      this.langService.langEmitter.subscribe(lang => {
        this.translateService.use(lang);
      });
    }

  ngOnInit(): void {
    this.wsCommentServiceService.getCommentStream(localStorage.getItem('roomId')).subscribe(_ => this.initKeywords());
    this.initKeywords();
    this.blacklistSubscription = this.topicCloudAdminService.getBlacklist().subscribe(list => this.blacklist = list);
    this.isCreatorOrMod = this.data ? (this.data.user.role !== UserRole.PARTICIPANT) : true;
    this.translateService.use(localStorage.getItem('currentLang'));
    this.sortQuestions();
    this.setDefaultAdminData();
    this.wantedLabels = spacyLabels;
  }

  ngOnDestroy(){
    this.setAdminData();
    if(this.blacklistSubscription !== undefined){
      this.blacklistSubscription.unsubscribe();
    }
  }

  initKeywords(){
    this.commentService.getFilteredComments(localStorage.getItem('roomId')).subscribe(comments => {
      this.keywords = [];
      comments.map(comment => {
        const keywords = this.keywordORfulltext === KeywordOrFulltext[0] ? comment.keywordsFromQuestioner : comment.keywordsFromSpacy;
        keywords.map(_keyword => {
          const existingKey = this.checkIfKeywordExists(_keyword);
          if (existingKey){
            existingKey.vote++;
            existingKey.questions.push(comment.body);
          } else {
            const keyword: Keyword = {
              keywordID: comment.id,
              keyword: _keyword,
              questions: [comment.body],
              vote: 1
            };
            this.keywords.push(keyword);
          }
        });
      });
      this.checkIfThereAreQuestions();
    });
  }

  setAdminData(){
    this.topicCloudAdminData = {
      blacklist: [],
      wantedLabels: this.wantedLabels,
      considerVotes: this.considerVotes,
      profanityFilter: this.profanityFilter,
      blacklistIsActive: this.blacklistIsActive,
      keywordORfulltext: KeywordOrFulltext[this.keywordORfulltext]
    };
    this.topicCloudAdminService.setAdminData(this.topicCloudAdminData);
  }

  setDefaultAdminData() {
    this.topicCloudAdminData = this.topicCloudAdminService.getDefaultAdminData;
    if (this.topicCloudAdminData) {
      this.considerVotes = this.topicCloudAdminData.considerVotes;
      this.profanityFilter = this.topicCloudAdminData.profanityFilter;
      this.blacklistIsActive = this.topicCloudAdminData.blacklistIsActive;
      this.keywordORfulltext = KeywordOrFulltext[this.topicCloudAdminData.keywordORfulltext];
      this.wantedLabels = this.topicCloudAdminData.wantedLabels;
    }
  }

  getKeywordWithoutProfanity(keyword: string): string {
    return this.topicCloudAdminService.filterProfanityWords(keyword);
  }

  getProfanityList() {
    return this.topicCloudAdminService.getCustomProfanityList();
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
        this.keywords.sort((a, b) => b.vote - a.vote);
        break;
    }
  }

  checkIfThereAreQuestions() {
    if (this.keywords.length === 0){
      this.translateService.get('topic-cloud-dialog.no-keywords-note').subscribe(msg => {
        this.notificationService.show(msg);
      });
      setTimeout(() => {
        this.cloudDialogRef.close();
      }, 0);
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
        const key2 = this.checkIfKeywordExists(this.newKeyword);
        if (key2){
          this.openConfirmDialog('merge-message', 'merge', keyword, key2);
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

  openConfirmDialog(msg: string, _confirmLabel: string, keyword: Keyword, mergeTarget?: Keyword) {
    const translationPart = 'topic-cloud-confirm-dialog.'+msg;
    const confirmDialogRef = this.confirmDialog.open(TopicCloudConfirmDialogComponent, {
      data: {topic: keyword.keyword, message: translationPart, confirmLabel: _confirmLabel}
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.deleteKeyword(keyword);
      } else if (result === 'merge') {
        this.mergeKeywords(keyword, mergeTarget);
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
      if(keyword.keyword.toLowerCase() === key.trim().toLowerCase()){
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

  addProfanityWord() {
    this.topicCloudAdminService.addToProfanityList(this.newProfanityWord);
    this.newProfanityWord = undefined;
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  addBlacklistWord() {
    this.topicCloudAdminService.addWordToBlacklist(this.newBlacklistWord);
    this.newBlacklistWord = undefined;
    if (this.searchMode){
      this.searchKeyword();
    }
  }

  removeWordFromProfanityList(word: string) {
    this.topicCloudAdminService.removeFromProfanityList(word);
  }

  removeWordFromBlacklist(word: string) {
    this.topicCloudAdminService.removeWordFromBlacklist(word);
  }

  refreshAllLists(){
    this.searchKeyword();
  }
}

interface Keyword {
  keywordID: string;
  keyword: string;
  questions: string[];
  vote: number;
}

export interface Data{
  user: User;
}

