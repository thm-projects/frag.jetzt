import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { WsCommentServiceService } from '../../../../services/websockets/ws-comment-service.service';
import { TSMap } from 'typescript-map';

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
  profanitywordlist: string[] = [];
  blacklistSubscription = undefined;
  profanitylistSubscription = undefined;
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
  deviceType: string;
  filteredKeywords: Keyword[] = [];
  showProfanityList = false;
  showBlacklistWordList = false;
  showSettingsPanel = false;
  keywordORfulltext: string = undefined;
  userRole: UserRole;
  spacyLabels: Labels;
  wantedLabels: {
    de: string[];
    en: string[];
  };
  spacyLabelsAllSelectedDE = true;

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
    this.deviceType = localStorage.getItem('deviceType');
    this.wsCommentServiceService.getCommentStream(localStorage.getItem('roomId')).subscribe(_ => this.updateKeywords());
    this.blacklistSubscription = this.topicCloudAdminService.getBlacklist().subscribe(list => this.blacklist = list);
    this.profanitywordlist = this.topicCloudAdminService.getProfanityListFromStorage();
    this.profanitylistSubscription = this.topicCloudAdminService.getCustomProfanityList().subscribe(list => {
      this.updateKeywords();
      this.profanitywordlist = list;
    });
    this.isCreatorOrMod = this.data.user.role !== UserRole.PARTICIPANT;
    this.translateService.use(localStorage.getItem('currentLang'));
    this.spacyLabels = spacyLabels;
    this.wantedLabels = undefined;
    this.setDefaultAdminData();
    this.updateKeywords();
  }

  ngOnDestroy(){
    this.setAdminData();
    if(this.blacklistSubscription !== undefined){
      this.blacklistSubscription.unsubscribe();
    }
    if(this.profanitylistSubscription !== undefined){
      this.profanitylistSubscription.unsubscribe();
    }
  }

  updateKeywords(){
    this.commentService.getFilteredComments(localStorage.getItem('roomId')).subscribe(comments => {
      this.keywords = [];
      comments.map(comment => {
        let keywords = comment.keywordsFromQuestioner;
        if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.keyword]){
          keywords = comment.keywordsFromSpacy;
        } else if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.both]){
          keywords = comment.keywordsFromQuestioner.concat(comment.keywordsFromSpacy);
        }

        if (!keywords){
          keywords = [];
        }

        keywords.map(_keyword => {
          const existingKey = this.checkIfKeywordExists(_keyword);
          if (existingKey){
            existingKey.vote += comment.score;
            if (this.checkIfCommentExists(existingKey.comments, comment.id)){
              existingKey.comments.push(comment);
            }
          } else {
            const keyword: Keyword = {
              keyword: _keyword,
              keywordWithoutProfanity: this.getKeywordWithoutProfanity(_keyword),
              comments: [comment],
              vote: comment.score
            };
            this.keywords.push(keyword);
          }
        });
      });
      this.sortQuestions();
    });
  }

  checkIfCommentExists(comments: Comment[], id: string): boolean{
    return comments.filter(comment => comment.id === id).length === 0;
  }

  setAdminData() {
    this.topicCloudAdminData = {
      blacklist: [],
      wantedLabels: {
        de: this.wantedLabels.de,
        en: this.wantedLabels.en
      },
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
      this.wantedLabels = {
        de: this.topicCloudAdminData.wantedLabels.de,
        en: this.topicCloudAdminData.wantedLabels.en
      };
    }
  }

  getKeywordWithoutProfanity(keyword: string): string {
    return this.topicCloudAdminService.filterProfanityWords(keyword);
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
        this.keywords.sort((a, b) => b.comments.length - a.comments.length);
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

  deleteKeyword(key: Keyword, message?: string): void{
    key.comments.map(comment => {
      const changes = new TSMap<string, any>();
      let keywords = comment.keywordsFromQuestioner;
      keywords.splice(keywords.indexOf(key.keyword, 0), 1);
      changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
      keywords = comment.keywordsFromSpacy;
      keywords.splice(keywords.indexOf(key.keyword, 0), 1);
      changes.set('keywordsFromSpacy', JSON.stringify(keywords));
      this.updateComment(comment, changes, message);
    });

    if (this.searchMode === true){
      this.searchKeyword();
    }
  }

  updateComment(updatedComment: Comment, changes: TSMap<string, any>, messageTranslate?: string){
    this.commentService.patchComment(updatedComment, changes).subscribe(_ => {
      if (messageTranslate){
        this.translateService.get('topic-cloud-dialog.' + messageTranslate).subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    },
      error => {
        this.translateService.get('topic-cloud-dialog.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
    });
  }

  cancelEdit(): void {
    this.edit = false;
    this.newKeyword = undefined;
  }

  confirmEdit(key: Keyword): void {
    const key2 = this.checkIfKeywordExists(this.newKeyword);
    if (key2){
      this.openConfirmDialog('merge-message', 'merge', key, key2);
    } else {
      key.comments.map(comment => {
        const changes = new TSMap<string, any>();
        let keywords = comment.keywordsFromQuestioner;
        for (let i = 0; i < keywords.length; i++){
          if (keywords[i].toLowerCase() === key.keyword.toLowerCase()){
            keywords[i] = this.newKeyword.trim();
          }
        }
        changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
        keywords = comment.keywordsFromSpacy;
        for (let i = 0; i < keywords.length; i++){
          if (keywords[i].toLowerCase() === key.keyword.toLowerCase()){
            keywords[i] = this.newKeyword.trim();
          }
        }
        changes.set('keywordsFromSpacy', JSON.stringify(keywords));
        this.updateComment(comment, changes, 'keyword-edit');
      });
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
        this.deleteKeyword(keyword, 'keyword-delete');
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
      key1.comments.map(comment => {
        if (this.checkIfCommentExists(key2.comments, comment.id)){
          const changes = new TSMap<string, any>();
          let keywords = comment.keywordsFromQuestioner;
          keywords.push(key2.keyword);
          changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
          keywords = comment.keywordsFromSpacy;
          keywords.push(key2.keyword);
          changes.set('keywordsFromSpacy', JSON.stringify(keywords));
          this.updateComment(comment, changes);
        }
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

  refreshAllLists() {
    this.searchKeyword();
  }

  selectAllDE() {
    if (this.wantedLabels.de.length < this.spacyLabels.de.length) {
      this.wantedLabels.de = [];
      this.spacyLabels.de.forEach(label => {
        this.wantedLabels.de.push(label.tag);
      });
      this.spacyLabelsAllSelectedDE = true;
    } else {
      this.wantedLabels.de = [];
      this.spacyLabelsAllSelectedDE = false;
    }
  }

  selectAllEN() {
    if (this.wantedLabels.en.length < this.spacyLabels.en.length) {
      this.wantedLabels.en = [];
      this.spacyLabels.en.forEach(label => {
        this.wantedLabels.en.push(label.tag);
      });
    } else {
      this.wantedLabels.en = [];
    }
  }
}

interface Keyword {
  keyword: string;
  keywordWithoutProfanity: string;
  comments: Comment[];
  vote: number;
}

export interface Data{
  user: User;
}

