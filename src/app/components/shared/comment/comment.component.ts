import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { Vote } from '../../../models/vote';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { PresentCommentComponent } from '../_dialogs/present-comment/present-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DeleteCommentComponent } from '../../creator/_dialogs/delete-comment/delete-comment.component';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { UserRole } from '../../../models/user-roles.enum';
import { Rescale } from '../../../models/rescale';
import { RowComponent } from '../../../../../projects/ars/src/lib/components/layout/frame/row/row.component';
import { User } from '../../../models/user';
import { RoomDataService } from '../../../services/util/room-data.service';
import { SpacyKeyword } from '../../../services/http/spacy.service';
import { UserBonusTokenComponent } from '../../participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { EditCommentTagComponent } from '../../creator/_dialogs/edit-comment-tag/edit-comment-tag.component';
import { SessionService } from '../../../services/util/session.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { BonusDeleteComponent } from '../../creator/_dialogs/bonus-delete/bonus-delete.component';
import { DashboardNotificationService } from '../../../services/util/dashboard-notification.service';
import { Room } from '../../../models/room';
import { HttpClient } from '@angular/common/http';
import { ForumComment } from '../../../utils/data-accessor';
import { QuillUtils } from '../../../utils/quill-utils';
import { forkJoin, ReplaySubject, takeUntil } from 'rxjs';
import { ResponseViewInformation } from '../comment-response-view/comment-response-view.component';
import { UserManagementService } from '../../../services/util/user-management.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  animations: [
    trigger('slide', [
      state('new', style({ opacity: 0, transform: 'translate(-100%, 0)' })),
      state('hidden', style({ opacity: 0, transform: 'translate(0, -10px)' })),
      state('visible', style({ opacity: 1, transform: 'translate(0, 0)' })),
      state('removed', style({ opacity: 0, transform: 'translate(100%, 0)' })),
      state('child', style({ opacity: 0, transform: 'translate(0, calc((-100% - 32px) * var(--i, 1)))', zIndex: -1 })),
      transition('hidden <=> visible', animate(700)),
      transition('new => visible', animate('700ms ease-in')),
      transition('child => visible', animate('700ms ease-in')),
      transition('visible => removed', animate('700ms ease-out'))
    ])
  ]
})
export class CommentComponent implements OnInit, AfterViewInit, OnDestroy {

  static COMMENT_MAX_HEIGHT = 250;

  @Input() comment: ForumComment;
  @Input() isMock = false;
  @Input() moderator: boolean;
  @Input() userRole: UserRole;
  @Input() user: User;
  @Input() disabled = false;
  @Input() usesJoyride = false;
  @Input() commentsWrittenByUser = 1;
  @Input() isFromModerator = false;
  @Input() isFromOwner = false;
  @Input() isResponse = false;
  @Input() responseIndex = 0;
  @Input() isAnswerView = false;
  @Input() indentationPossible = false;
  @Input() showResponses: boolean = false;
  @Output() clickedOnTag = new EventEmitter<string>();
  @Output() clickedOnKeyword = new EventEmitter<string>();
  @Output() clickedUserNumber = new EventEmitter<string>();
  @Output() votedComment = new EventEmitter<string>();
  @Output() sortedAnswers = new EventEmitter<string>();
  @ViewChild('commentBody', { static: true }) commentBody: RowComponent;
  @ViewChild('commentBodyInner', { static: true }) commentBodyInner: RowComponent;
  @ViewChild('commentExpander', { static: true }) commentExpander: RowComponent;
  readableCommentBody: string;
  isStudent = false;
  isCreator = false;
  isModerator = false;
  hasVoted = 0;
  language: string;
  inAnswerView = false;
  currentVote: string;
  slideAnimationState = 'hidden';
  roleString: string;
  isExpanded = false;
  isExpandable = false;
  filterProfanityForModerators = false;
  isProfanity = false;
  roomTags: string[];
  room: Room;
  responses: ForumComment[] = [];
  isConversationView: boolean;
  sortMethod = 'Time';
  currentDateString = '?';
  viewInfo: ResponseViewInformation;
  commentRegistrationId: string;
  private _votes;
  private _commentNumber: string[] = [];
  private _destroyer = new ReplaySubject(1);

  constructor(
    protected userManagementService: UserManagementService,
    private route: ActivatedRoute,
    private location: Location,
    protected router: Router,
    private sessionService: SessionService,
    private commentService: CommentService,
    private notification: NotificationService,
    private translateService: TranslateService,
    private roomDataService: RoomDataService,
    public http: HttpClient,
    public dialog: MatDialog,
    protected langService: LanguageService,
    public deviceInfo: DeviceInfoService,
    public notificationService: DashboardNotificationService,
  ) {
    langService.getLanguage().pipe(takeUntil(this._destroyer)).subscribe(lang => {
      this.language = lang;
      this.http.get('/assets/i18n/dashboard/' + lang + '.json').subscribe(translation => {
        this.translateService.setTranslation(lang, translation, true);
      });
      this.generateCommentNumber();
      this.onLanguageChange();
    });
  }

  @Input() set isRemoved(value: boolean) {
    if (value) {
      this.slideAnimationState = 'removed';
    }
  }

  @Input()
  set parseVote(votes: { [commentId: string]: Vote }) {
    if (votes) {
      this._votes = votes;
    }
  }

  getCommentIcon(): string {
    if (this.comment?.brainstormingQuestion) {
      return 'psychology_alt';
    } else if (this.isFromOwner) {
      return 'co_present';
    } else if (this.isFromModerator) {
      return 'support_agent';
    }
    return 'person';
  }

  getCommentIconClass(): string {
    if (this.comment?.brainstormingQuestion || this.isFromOwner || this.isFromModerator) {
      return '';
    }
    return 'material-icons-outlined';
  }

  ngOnInit() {
    this.isConversationView = this.router.url.endsWith('conversation');
    if (this.comment?.created) {
      this.slideAnimationState = 'new';
    }
    if (this.isConversationView) {
      this.slideAnimationState = this.isResponse ? 'child' : 'visible';
    }
    this.readableCommentBody = this.comment?.body ? QuillUtils.getTextFromDelta(this.comment.body) : '';
    this.commentRegistrationId = this.comment?.id;
    this.checkProfanity();
    switch (this.userRole) {
      case UserRole.PARTICIPANT.valueOf():
        this.isStudent = true;
        this.roleString = 'participant';
        break;
      case UserRole.CREATOR.valueOf():
        this.isCreator = true;
        this.roleString = 'creator';
        break;
      case UserRole.EXECUTIVE_MODERATOR.valueOf():
        this.isModerator = true;
        this.roleString = 'moderator';
    }
    this.inAnswerView = !this.router.url.includes('comments');
    this.roomTags = this.sessionService.currentRoom?.tags;
    this.room = this.sessionService.currentRoom;
    this.onLanguageChange();
    this.getResponses();
  }

  checkProfanity() {
    if (this.isMock) {
      this.isProfanity = false;
      this.filterProfanityForModerators = false;
      return;
    }
    this.isProfanity = this.roomDataService.isCommentProfane(this.comment, !this.comment.ack);
    this.filterProfanityForModerators = !this.roomDataService.isCommentCensored(this.comment, !this.comment.ack);
  }

  changeProfanityShowForModerators(comment: Comment) {
    this.roomDataService.applyStateToComment(comment, !this.filterProfanityForModerators, !comment.ack);
    this.filterProfanityForModerators = !this.filterProfanityForModerators;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.generateCommentNumber();
      if (this.isMock) {
        this.isExpandable = false;
        this.commentExpander.ref.nativeElement.style.display = 'none';
        return;
      }
      this.isExpandable = this.commentBody.getRenderedHeight() > CommentComponent.COMMENT_MAX_HEIGHT;
      if (!this.isExpandable) {
        this.commentExpander.ref.nativeElement.style.display = 'none';
      } else {
        this.commentBody.setPx(CommentComponent.COMMENT_MAX_HEIGHT);
        this.commentBody.setOverflow('hidden');
      }
    });
  }

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
  }

  sortKeywords(keywords: SpacyKeyword[]) {
    return keywords.sort((a, b) => a.text.localeCompare(b.text));
  }

  toggleExpand(evt: MouseEvent) {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.commentBody.setPx(this.commentBodyInner.getRenderedHeight());
      this.commentBody.setOverflow('visible');
    } else {
      this.commentBody.setPx(CommentComponent.COMMENT_MAX_HEIGHT);
      this.commentBody.setOverflow('hidden');
    }
  }

  changeSlideState(): void {
    if (this.slideAnimationState === 'removed') {
      if (this.comment.removed) {
        this.comment.removed = false;
        this.commentRegistrationId = null;
      }
      return;
    }
    if (this.slideAnimationState === 'new') {
      if (this.comment?.created) {
        this.comment.created = false;
      }
    }
    this.slideAnimationState = 'visible';
  }

  setRead(comment: Comment): void {
    this.commentService.toggleRead(comment).subscribe(c => {
      this.comment.read = c.read;
      this.checkProfanity();
    });
  }

  markCorrect(comment: Comment, type: CorrectWrong): void {
    if (comment.correct === type) {
      comment.correct = CorrectWrong.NULL;
    } else {
      comment.correct = type;
    }
    this.commentService.markCorrect(comment).subscribe(c => {
      this.comment.correct = c.correct;
      this.checkProfanity();
    });
  }

  setFavorite(comment: Comment): void {
    if (this.comment.favorite) {
      if (!this.room?.bonusArchiveActive) {
        this.commentService.toggleFavorite(comment).subscribe();
        return;
      }
      const dialogRef = this.dialog.open(BonusDeleteComponent, {
        width: '400px'
      });
      dialogRef.componentInstance.multipleBonuses = false;
      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'delete') {
            this.commentService.toggleFavorite(comment).subscribe(c => {
              this.notifyFavorite(c);
            });
          }
        });
    } else {
      this.commentService.toggleFavorite(comment).subscribe(c => {
        if (this.room?.bonusArchiveActive) {
          this.notifyFavorite(c);
        }
      });
    }
  }

  notifyFavorite(comment: Comment) {
    this.comment.favorite = comment.favorite;
    this.checkProfanity();
    const text = this.comment.favorite ? 'comment-list.question-was-marked-with-a-star' :
      'comment-list.star-was-withdrawn-from-the-question';
    this.translateService.get(text).subscribe(ret => this.notification.show(ret));
  }

  voteUp(comment: Comment): void {
    if (this.isMock) {
      return;
    }
    const userId = this.userManagementService.getCurrentUser().id;
    if (this.hasVoted !== 1) {
      this.commentService.voteUp(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = 1;
      this.currentVote = '1';
    } else {
      this.commentService.resetVote(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = 0;
      this.currentVote = '0';
    }
    this.resetVotingAnimation();
  }

  voteDown(comment: Comment): void {
    if (this.isMock) {
      return;
    }
    const userId = this.userManagementService.getCurrentUser().id;
    if (this.hasVoted !== -1) {
      this.commentService.voteDown(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = -1;
      this.currentVote = '-1';
    } else {
      this.commentService.resetVote(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = 0;
      this.currentVote = '0';
    }
    this.resetVotingAnimation();
  }

  openDeleteCommentDialog(): void {
    const dialogRef = this.dialog.open(DeleteCommentComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.delete();
        }
      });
  }

  openChangeCommentTagDialog(): void {
    const dialogRef = this.dialog.open(EditCommentTagComponent, {
      minWidth: '80%'
    });
    dialogRef.componentInstance.selectedTag = this.comment.tag;
    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.updateCommentTag(result);
      }
    });
  }

  resetVotingAnimation() {
    setTimeout(() => {
        this.currentVote = '';
      },
      1000);
  }

  answerComment() {
    if (this.isMock) {
      return;
    }
    if (this.isStudent && this.room.conversationDepth <= this.comment.commentDepth) {
      return;
    }
    let url: string;
    this.route.params.subscribe(params => {
      url = `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}`;
    });
    localStorage.setItem('answeringQuestion', this.comment.id);
    this.router.navigate([url]);
  }

  showConversation() {
    if (this.isMock) {
      return;
    }
    this.showResponses = true;
    if (true) {
      return; //TODO: REMOVE
    }
    if (this.isConversationView && this.indentationPossible) {
      this.showResponses = true;
    } else {
      let url: string;
      this.route.params.subscribe(params => {
        url = `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}/conversation`;
      });
      this.router.navigate([url]);
    }
  }

  hideConversation() {
    if (this.isMock) {
      return;
    }
    this.showResponses = false;
  }

  delete(): void {
    this.commentService.deleteComment(this.comment.id).subscribe(room => {
      this.translateService.get('comment-list.comment-deleted').subscribe(msg => {
        this.notification.show(msg);
      });
    });
  }

  updateCommentTag(tag: string) {
    this.commentService.updateCommentTag(this.comment, tag).subscribe(comment => {
      this.comment.tag = comment.tag;
      this.checkProfanity();
    });
  }

  setAck(comment: Comment): void {
    this.commentService.toggleAck(comment).subscribe(c => {
      this.comment.ack = c.ack;
    });
  }

  setBookmark(comment: Comment): void {
    if (this.isMock) {
      return;
    }
    if (this.userRole === UserRole.PARTICIPANT) {
      this.roomDataService.toggleBookmark(comment);
      return;
    }
    this.commentService.toggleBookmark(comment).subscribe(c => {
      this.comment.bookmark = c.bookmark;
      this.checkProfanity();
    });
  }

  goToFullScreen(element: Element): void {
    Rescale.requestFullscreen();
  }

  exitFullScreen(): void {
    Rescale.exitFullscreen();
  }

  openPresentDialog(comment: Comment): void {
    if (this.isCreator === true) {
      this.commentService.highlight(comment).subscribe();
      if (!comment.read) {
        this.setRead(comment);
      }
    }
    const dialogRef = this.dialog.open(PresentCommentComponent, {
      position: {
        left: '10px',
        right: '10px'
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%'
    });
    dialogRef.componentInstance.body = comment.body;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.commentService.lowlight(comment).subscribe();
        this.exitFullScreen();

      });
  }

  openBonusStarDialog() {
    const dialogRef = this.dialog.open(UserBonusTokenComponent, {
      width: '600px'
    });
    dialogRef.componentInstance.userId = this.user.id;
  }

  getBorderClass(): string {
    if (this.isFromOwner) {
      return 'border-fromOwner';
    } else if (this.isFromModerator) {
      return 'border-fromModerator';
    } else if (this.comment.favorite) {
      return 'border-favorite';
    } else if (this.comment.bookmark) {
      return 'border-bookmark';
    } else if (this.comment.correct === CorrectWrong.WRONG) {
      return 'border-wrong';
    } else if (this.comment.correct === CorrectWrong.CORRECT) {
      return 'border-correct';
    } else if (this.comment.creatorId === this.user?.id) {
      return 'border-ownQuestion';
    } else if (this.moderator) {
      return 'border-moderated';
    }
    return 'border-notMarked';
  }

  respondToComment() {
    let url: string;
    this.route.params.subscribe(params => {
      url = `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}`;
    });
    this.router.navigate([url]);
  }

  getResponses() {
    this.hasVoted = this._votes[this.comment.id]?.vote;
    this.responses = [...this.comment.children];
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([room, mods]) => {
      this.viewInfo = {
        roomId: room.id,
        mods: new Set<string>(mods.map(m => m.accountId)),
        roomThreshold: room.threshold,
        roomOwner: room.ownerId,
        user: this.user,
        userRole: this.userRole,
        isModerationComment: this.isModerator,
        votes: this._votes,
      };
    });
  }

  toggleNotifications() {
    if (this.isMock) {
      return true;
    }
    if (this.notificationService.hasCommentSubscription(this.comment.id)) {
      this.notificationService.deleteCommentSubscription(this.comment.id).subscribe();
    } else {
      this.notificationService.addCommentSubscription(this.comment.roomId, this.comment.id).subscribe();
    }
  }

  sortAnswers(value: string) {
    this.sortedAnswers.emit(value);
    this.sortMethod = value;
  }

  getPrettyCommentNumber(): string[] {
    return this._commentNumber;
  }

  getTranslationForBonus(message: string) {
    return `comment-page.${message}${!this.room?.bonusArchiveActive ? '-disabled-bonus' : ''}`;
  }

  ownsComment() {
    return this.comment.creatorId === (this.user?.id || 'invalid');
  }

  hasOneAction(): boolean {
    const keys = ['star', 'change-tag', 'delete'] as const;
    return keys.some(key => this.canInteractWithAction(key));
  }

  canInteractWithAction(interaction: 'star' | 'change-tag' | 'delete'): boolean {
    const hasPrivileges = !this.isStudent || this.ownsComment();
    return (interaction === 'star' && !this.isStudent && !this.comment.favorite) ||
      (interaction === 'change-tag' && this.roomTags?.length && hasPrivileges) ||
      (interaction === 'delete' && hasPrivileges && !this.comment.favorite);
  }

  private onLanguageChange() {
    if (!this.comment) {
      return;
    }
    const date = new Date(this.comment.createdAt);
    const dateString = date.toLocaleDateString(this.langService.currentLanguage() ?? undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeString = date.toLocaleTimeString(this.langService.currentLanguage() ?? undefined, {
      minute: '2-digit',
      hour: '2-digit',
    });
    this.readableCommentBody = dateString + ' ' + timeString;
  }

  private generateCommentNumber() {
    if (!this.comment?.number) {
      return;
    }
    this._commentNumber = Comment.computePrettyCommentNumber(this.translateService, this.comment);
  }
}
