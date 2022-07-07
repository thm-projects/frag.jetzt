import { Component, ComponentRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { CommentService } from '../../../services/http/comment.service';
import { Comment } from '../../../models/comment';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAnswerComponent } from '../../creator/_dialogs/delete-answer/delete-answer.component';
import { EventService } from '../../../services/util/event.service';
import { WriteCommentComponent } from '../write-comment/write-comment.component';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { RoomDataService } from '../../../services/util/room-data.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { SessionService } from '../../../services/util/session.service';
import { Room } from '../../../models/room';
import { VoteService } from '../../../services/http/vote.service';
import { Vote } from '../../../models/vote';
import { Location } from '@angular/common';
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { DeepLService } from '../../../services/http/deep-l.service';
import { SpacyService } from '../../../services/http/spacy.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { SpacyDialogComponent } from '../_dialogs/spacy-dialog/spacy-dialog.component';
import { ForumComment } from '../../../utils/data-accessor';
import { KeywordExtractor, KeywordsResultType } from '../../../utils/keyword-extractor';
import { QuillUtils, StandardDelta } from '../../../utils/quill-utils';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss']
})
export class CommentAnswerComponent implements OnInit, OnDestroy {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;

  comment: ForumComment;
  answer: StandardDelta;
  isLoading = true;
  userRole: UserRole;
  user: User;
  isStudent = true;
  isCreator: boolean = false;
  isModerator: boolean = false;
  edit = false;
  room: Room;
  mods: Set<string>;
  vote: Vote;
  isModerationComment = false;
  isSending = false;
  isConversationView: boolean;
  roleString: string;
  private _commentSubscription;
  private _list: ComponentRef<any>[];
  private _keywordExtractor: KeywordExtractor;

  constructor(
    protected route: ActivatedRoute,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    protected langService: LanguageService,
    private authenticationService: AuthenticationService,
    protected commentService: CommentService,
    private roomDataService: RoomDataService,
    public dialog: MatDialog,
    private router: Router,
    public eventService: EventService,
    private sessionService: SessionService,
    private voteService: VoteService,
    private location: Location,
    private languagetoolService: LanguagetoolService,
    private deepLService: DeepLService,
    private spacyService: SpacyService,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
  ) {
    this._keywordExtractor = new KeywordExtractor(languagetoolService, spacyService, deepLService);
  }

  get responses() {
    return [...this.comment.children];
  }

  ngOnInit() {
    this.isConversationView = this.router.url.endsWith('conversation');
    this.userRole = this.sessionService.currentRole;
    this.initNavigation();
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    if (this.userRole !== UserRole.PARTICIPANT) {
      this.isStudent = false;
    }
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
    this.route.params.subscribe(params => {
      const commentId = params['commentId'];
      forkJoin([this.sessionService.getRoomOnce(), this.sessionService.getModeratorsOnce()])
        .subscribe(([room, mods]) => {
          this.room = room;
          this.mods = new Set<string>(mods.map(m => m.accountId));
          this.voteService.getByRoomIdAndUserID(this.sessionService.currentRoom.id, this.user.id).subscribe(votes => {
            this.vote = votes.find(v => v.commentId === commentId);
          });
          this.findComment(commentId).subscribe(result => {
            if (!result) {
              this.onNoComment();
            } else {
              this.onCommentReceive(...result);
            }
          });
        });
    });
  }

  ngOnDestroy() {
    const source = this.isModerationComment ? this.roomDataService.moderatorDataAccessor : this.roomDataService.dataAccessor;
    source.unregisterUI(true);
    this._list?.forEach(e => e.destroy());
    this._commentSubscription?.unsubscribe();
    if (this.comment && !this.isStudent) {
      this.commentService.lowlight(this.comment).subscribe();
    }
  }

  checkForEscape(event: KeyboardEvent) {
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape)) {
      if (this.eventService.focusOnInput) {
        this.eventService.makeFocusOnInputFalse();
        (document.activeElement as HTMLElement).blur();
        return;
      }
      this.goBackToCommentList();
    }
  }

  checkForBackDropClick(event: PointerEvent, ...elements: Node[]) {
    if (this.isConversationView) {
      return;
    }
    const target = event.target as Node;
    const parent = document.querySelector('.main_container');
    if (event.target && parent.contains(target) && !elements.some(e => e?.contains(target))) {
      this.goBackToCommentList();
    }
  }

  goBackToCommentList() {
    this.location.back();
  }

  receiveFromDeepL(body: StandardDelta) {
    //TODO update to another component
    this.saveAnswer(body);
  }

  submitNormal(body: StandardDelta, _text: string, tag: string, name: string, verifiedWithoutDeepl: boolean) {
    this.isSending = true;
    const response: Comment = new Comment();
    response.roomId = this.room.id;
    response.body = body;
    response.creatorId = this.user.id;
    response.createdFromLecturer = this.userRole > 0;
    response.commentReference = this.comment.id;
    response.tag = tag;
    response.questionerName = name;
    this.openSpacyDialog(response, !verifiedWithoutDeepl, computed => {
      localStorage.setItem('comment-created', String(true));
      this.commentService.addComment(computed).subscribe(() => {
        let url: string;
        this.route.params.subscribe(params => {
          url = `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}/conversation`;
        });
        this.router.navigate([url]);
      });
      this.translateService.get('comment-list.comment-sent')
        .subscribe(msg => this.notificationService.show(msg));
    });
  }

  openSpacyDialog(comment: Comment, forward: boolean, onFinish: (comment) => void): void {
    this._keywordExtractor.generateKeywords(comment.body, false, forward, this.commentComponent.selectedLang)
      .subscribe(result => {
        this.isSending = false;
        comment.language = result.language;
        comment.keywordsFromSpacy = result.keywords;
        comment.keywordsFromQuestioner = [];
        if (forward ||
          ((result.resultType === KeywordsResultType.Failure) && !result.wasSpacyError) ||
          result.resultType === KeywordsResultType.BadSpelled) {
          onFinish(comment);
        } else {
          const dialogRef = this.dialog.open(SpacyDialogComponent, {
            data: {
              result: result.resultType,
              comment
            }
          });
          dialogRef.afterClosed().subscribe(dialogResult => {
            if (dialogResult) {
              onFinish(dialogResult);
            }
          });
        }
      });
  }

  saveAnswer(data: StandardDelta, forward = false): void {
    this.answer = QuillUtils.transformURLtoQuillLink(data, true);
    this.edit = !this.answer;
  }

  openDeleteAnswerDialog(): () => void {
    return () => {
      const dialogRef = this.dialog.open(DeleteAnswerComponent, {
        width: '400px'
      });
      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'delete') {
            this.deleteAnswer();
          }
        });
    };
  }

  deleteAnswer() {
    this.commentComponent.commentData.clear();
    this.answer = null;
    this.translateService.get('comment-page.answer-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  onEditClick() {
    this.edit = true;
    setTimeout(() => this.commentComponent.commentData.set(this.answer));
  }

  applySortAnswers(value: string) {
    switch (value) {
      case 'Time':
        this.responses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.responses.reverse();
        break;
      case 'BestScore':
        this.responses.sort((a, b) => b.score - a.score);
        break;
      case 'WorstScore':
        this.responses.sort((a, b) => b.score - a.score);
        this.responses.reverse();
        break;
    }
  }

  private findComment(commentId: string): Observable<[ForumComment, boolean]> {
    return this.roomDataService.dataAccessor.getRawComments(true, true).pipe(
      map(comments => {
        const foundComment = comments.find(c => c.id === commentId);
        return (foundComment ? [foundComment, false] : null) as [ForumComment, boolean];
      }),
      mergeMap(current => {
        if (current) {
          return of(current);
        }
        if (!this.roomDataService.canAccessModerator) {
          return of(null);
        }
        return this.roomDataService.moderatorDataAccessor.getRawComments(true, true).pipe(
          map(comments => {
            const foundComment = comments.find(c => c.id === commentId);
            return (foundComment ? [foundComment, true] : null) as [ForumComment, boolean];
          })
        );
      })
    );
  }

  private onCommentReceive(c: ForumComment, isModerationComment: boolean) {
    this.comment = c;
    this.isModerationComment = isModerationComment;
    this.edit = !this.answer;
    this.isLoading = false;
    const source = isModerationComment ? this.roomDataService.moderatorDataAccessor : this.roomDataService.dataAccessor;
    source.registerUI(true);
    this._commentSubscription = source.receiveUpdates([
      { type: 'CommentPatched', finished: true, updates: ['ack'] },
      { type: 'CommentDeleted', finished: true }
    ]).subscribe(update => {
      if (update.comment.id !== this.comment.id) {
        return;
      }
      if (update.type === 'CommentPatched' && update.finished === true) {
        if (update.updates.includes('ack') && !this.roomDataService.canAccessModerator) {
          this.onNoComment();
        }
      } else if (update.type === 'CommentDeleted') {
        this.onNoComment();
      }
    });
    if (!this.isStudent) {
      this.commentService.highlight(this.comment).subscribe();
    }
  }

  private onNoComment() {
    this.translateService.get('comment-page.no-comment')
      .subscribe(msg => this.notificationService.show(msg));
    this.goBackToCommentList();
  }

  private initNavigation() {
    this._list = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'forum',
        class: 'material-icons-outlined',
        text: 'header.back-to-questionboard',
        callback: () => {
          let role = 'participant';
          if (this.userRole === UserRole.CREATOR) {
            role = 'creator';
          } else if (this.userRole > UserRole.PARTICIPANT) {
            role = 'moderator';
          }
          this.router.navigate([role + '/room/' + this.room?.shortId + '/comments']);
        },
        condition: () => true
      });
    });
  }
}
