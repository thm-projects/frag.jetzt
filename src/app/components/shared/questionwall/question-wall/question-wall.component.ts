import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WsCommentService } from '../../../../services/websockets/ws-comment.service';
import { QuestionWallComment } from '../QuestionWallComment';
import { ColComponent } from '../../../../../../projects/ars/src/lib/components/layout/frame/col/col.component';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Rescale } from '../../../../models/rescale';
import { QuestionWallKeyEventSupport } from '../QuestionWallKeyEventSupport';
import { MatSliderChange } from '@angular/material/slider';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { Period } from '../../comment-list/comment-list.filter';
import { User } from '../../../../models/user';
import { UserRole } from '../../../../models/user-roles.enum';

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss']
})
export class QuestionWallComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ColComponent) colComponent: ColComponent;
  @ViewChild('sidelist') sidelist: ColComponent;

  sidelistExpanded: boolean = true;
  qrCodeExpanded: boolean = false;
  roomId: string;
  room: Room;
  comments: QuestionWallComment[] = [];
  commentsFilteredByTime: QuestionWallComment[] = [];
  commentsFilter: QuestionWallComment[] = [];
  currentCommentList: QuestionWallComponent[] = [];
  commentFocus: QuestionWallComment;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  unreadComments = 0;
  focusIncommingComments = true;
  timeUpdateInterval;
  keySupport: QuestionWallKeyEventSupport;
  hasFilter = false;
  filterTitle = '';
  filterDesc = '';
  filterIcon = '';
  isSvgIcon = false;
  filterFunction: (x: QuestionWallComment) => boolean;
  userMap: Map<number, number> = new Map<number, number>();
  userList = [];
  userSelection = false;
  tags;
  fontSize = 180;
  periodsList = Object.values(Period);
  period: Period = Period.all;
  isLoading = true;
  user: User;
  animationTrigger:boolean=true;

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private commentService: CommentService,
    private roomService: RoomService,
    private wsCommentService: WsCommentService,
    private langService: LanguageService,
    private translateService: TranslateService,
    private roomDataService: RoomDataService
    ) {
    this.keySupport = new QuestionWallKeyEventSupport();
    this.roomId = localStorage.getItem('roomId');
    this.timeUpdateInterval = setInterval(() => {
      this.comments.forEach(e => e.updateTimeAgo());
    }, 15000);
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
      QuestionWallComment.updateTimeFormat(lang);
    });
  }

  public wrap<E>(e: E, action: (e: E) => void) {
    action(e);
  }

  public notUndefined<E>(e: E, action: (e: E) => void, elsePart?: () => void) {
    if (e) {
      action(e);
    } else if (elsePart) {
      elsePart();
    }
  }

  toggleSideList(){
    this.sidelistExpanded=!this.sidelistExpanded;
    if(this.sidelistExpanded){
      this.sidelist.setPx(450);
    }
    else{
      this.sidelist.setPx(0);
    }
  }

  getURL(){
    if(!this.room)return '';
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${this.room.shortId}`;
  }

  toggleQRCode(){
    this.qrCodeExpanded=!this.qrCodeExpanded;
  }

  ngOnInit(): void {
    QuestionWallComment.updateTimeFormat(localStorage.getItem('currentLang'));
    this.translateService.use(localStorage.getItem('currentLang'));
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this.roomDataService.getRoomData(this.roomId).subscribe(e => {
      if (e === null) {
        return;
      }
      e.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      this.isLoading = false;
      e.forEach(c => {
        this.roomDataService.checkProfanity(c);
        const comment = new QuestionWallComment(c, true);
        this.comments.push(comment);
        this.setTimePeriod(this.period);
      });
      this.updateCommentsCountOverview();
    });
    this.roomService.getRoom(this.roomId).subscribe(e => {
      this.room = e;
      this.tags = e.tags;
    });
    this.subscribeCommentStream();
    this.initKeySupport();
  }

  subscribeCommentStream() {
    this.roomDataService.receiveUpdates([
      { type: 'CommentCreated', finished: true},
      { type: 'CommentPatched', finished: true, updates: ['upvotes'] },
      { type: 'CommentPatched', finished: true, updates: ['downvotes'] },
      {finished: true}
    ]).subscribe(update => {
      if (update.type === 'CommentCreated') {
        this.wrap(this.pushIncommingComment(update.comment), qwComment => {
          if (this.focusIncommingComments) {
            setTimeout(() => this.focusComment(qwComment), 5);
          }
        });
      } else if (update.type === 'CommentPatched') {
        const qwComment = this.comments.find(f => f.comment.id === update.comment.id);
        qwComment.comment = update.comment;
      }
    });
  }

  updateCommentsCountOverview(): void {
    const tempUserSet = new Set();
    const comments = this.getCurrentCommentList();
    comments.forEach((wallComment) => tempUserSet.add(wallComment.comment.userNumber));
    this.commentsCountQuestions = comments.length;
    this.commentsCountUsers = tempUserSet.size;
  }

  initKeySupport() {
    this.wrap(this.keySupport, key => {
      key.addKeyEvent('ArrowRight', () => this.nextComment());
      key.addKeyEvent('ArrowLeft', () => this.prevComment());
      key.addKeyEvent('l', () => this.toggleSideList());
      key.addKeyEvent('q', () => this.toggleQRCode());
    });
  }

  ngAfterViewInit(): void {
    document.getElementById('header_rescale').style.display = 'none';
    document.getElementById('footer_rescale').style.display = 'none';
    setTimeout(() => {
      Rescale.requestFullscreen();
    }, 10);
    setTimeout(() => {
      Array.from(document.getElementsByClassName('questionwall-screen')[0].getElementsByTagName('button')).forEach(e=>{
        e.addEventListener('keydown',e=>{
          e.preventDefault();
        });
      });
    }, 100);
  }

  ngOnDestroy(): void {
    this.keySupport.destroy();
    window.clearInterval(this.timeUpdateInterval);
    document.getElementById('header_rescale').style.display = 'block';
    document.getElementById('footer_rescale').style.display = 'block';
    Rescale.exitFullscreen();
  }

  nextComment() {
    this.moveComment(1);
  }

  prevComment() {
    this.moveComment(-1);
  }

  getDOMComments() {
    return Array.from(document.getElementsByClassName('questionwall-comment-anchor'));
  }

  getDOMCommentFocus() {
    return this.getDOMComments()[this.getCommentFocusIndex()];
  }

  getCommentFocusIndex() {
    return this.getCurrentCommentList().indexOf(this.commentFocus);
  }

  moveComment(fx: number) {
    if (this.getCurrentCommentList().length === 0) {
      return;
    } else if (!this.commentFocus) {
      this.focusComment(this.getCurrentCommentList()[0]);
    } else {
      const cursor = this.getCommentFocusIndex();
      if (cursor + fx >= this.getCurrentCommentList().length || cursor + fx < 0) {
        return;
      } else {
        this.focusComment(this.getCurrentCommentList()[cursor + fx]);
      }
    }
  }

  pushIncommingComment(comment: Comment): QuestionWallComment {
    this.roomDataService.checkProfanity(comment);
    const qwComment = new QuestionWallComment(comment, false);
    this.comments = [qwComment, ...this.comments];
    this.setTimePeriod(this.period);
    this.unreadComments++;
    this.updateCommentsCountOverview();
    return qwComment;
  }

  focusComment(comment: QuestionWallComment) {
    if(this.commentFocus === comment)return;
    this.commentFocus = null;
    setTimeout(()=>{
      this.commentFocus = comment;
      if (!comment.old) {
        comment.old = true;
        this.unreadComments--;
      }
      this.getDOMCommentFocus().scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    },1);
  }

  toggleFocusIncommingComments() {
    this.focusIncommingComments = !this.focusIncommingComments;
  }

  createUserMap() {
    this.userMap = new Map();
    this.commentsFilteredByTime.forEach(c => {
      if (!this.userMap.has(c.comment.userNumber)) {
        this.userMap.set(c.comment.userNumber, 0);
      }
      this.userMap.set(c.comment.userNumber, this.userMap.get(c.comment.userNumber) + 1);
    });
    this.userList = [];
    this.userMap.forEach((num, user) => {
      this.userList.push([num, user]);
    });
  }

  applyUserMap(user: number) {
    this.userSelection = false;
    this.filterUserByNumber(user);
  }

  openUserMap() {
    if (this.userSelection) {
      return;
    }
    this.hasFilter = false;
    this.createUserMap();
    this.userSelection = true;
    this.updateCommentsCountOverview();
  }

  cancelUserMap() {
    this.userSelection = false;
    this.updateCommentsCountOverview();
  }

  leave() {
    const resolveUserRole:()=>string=()=>{
      switch(this.user?this.user.role:-1){
        case UserRole.PARTICIPANT:return 'participant';
        case UserRole.EDITING_MODERATOR:return 'moderator';
        case UserRole.EXECUTIVE_MODERATOR:return 'moderator';
        case UserRole.CREATOR:return 'creator';
        default: return 'participant'
      }
    }
    this.router.navigate(['/'+resolveUserRole()+'/room/'+this.room.shortId+'/comments']);
  }

  likeComment(comment: QuestionWallComment) {
    this.commentService.voteUp(comment.comment, this.user.id).subscribe();
  }

  dislikeComment(comment: QuestionWallComment) {
    this.commentService.voteDown(comment.comment, this.user.id).subscribe();
  }

  sortScore(reverse?: boolean) {
    this.sort((a, b) => a.comment.score - b.comment.score, reverse);
  }

  sortTime(reverse?: boolean) {
    this.sort((a, b) => new Date(a.comment.timestamp).getTime() - new Date(b.comment.timestamp).getTime(), reverse);
  }

  notifyCommentListChange(){
    this.animationTrigger=false;
    setTimeout(()=>{
      this.animationTrigger=true;
    },1);
  }

  sort(fun: (a, b) => number, reverse: boolean) {
    const commentList = this.getCurrentCommentList();
    if (reverse) {
      commentList.sort(this.reverse(fun));
    } else {
      commentList.sort(fun);
    }
    setTimeout(() => {
      if (commentList.length > 1) {
        this.focusComment(commentList[0]);
      }
    }, 0);
    this.notifyCommentListChange();
  }

  getCurrentCommentList() {
    if (this.hasFilter) {
      return this.commentsFilter;
    } else {
      return this.commentsFilteredByTime;
    }
  }

  reverse(fun: (a, b) => number): (a, b) => number {
    return (a, b) => fun(b, a);
  }

  filterFavorites() {
    this.filter('grade', false, 'question-wall.filter-favorite', '',
      x => x.comment.favorite);
  }

  filterUser(comment: QuestionWallComment) {
    this.filterUserByNumber(comment.comment.userNumber);
  }

  filterUserByNumber(user: number) {
    this.filter('person_pin_circle', false, 'question-wall.filter-user', user + '',
      x => x.comment.userNumber === user);
  }

  filterBookmark() {
    this.filter('bookmark', false, 'question-wall.filter-bookmark', '',
      x => x.comment.bookmark);
  }

  filterTag(tag: string) {
    this.filter('comment_tag', true, '', tag, x => x.comment.tag === tag);
  }

  filter(icon: string, isSvgIcon: boolean, title: string, desc: string, filter: (x: QuestionWallComment) => boolean) {
    if(!this.sidelistExpanded){
      this.toggleSideList();
    }
    this.cancelUserMap();
    this.filterIcon = icon;
    this.isSvgIcon = isSvgIcon;
    this.filterTitle = title;
    this.filterDesc = desc;
    this.filterFunction = filter;
    this.commentsFilter = this.commentsFilteredByTime.filter(this.filterFunction);
    this.hasFilter = true;
    setTimeout(() => {
      if (this.commentsFilter.length <= 0) {
        this.commentFocus = null;
      } else {
        this.focusFirstComment();
      }
    }, 0);
    this.updateCommentsCountOverview();
    this.notifyCommentListChange();
  }

  focusFirstComment() {
    if (this.getCurrentCommentList().length > 0) {
      this.commentFocus = this.getCurrentCommentList()[0];
    }
  }

  deactivateFilter() {
    this.hasFilter = false;
    this.filterFunction = null;
    this.updateCommentsCountOverview();
  }

  toggleFilter() {
    this.hasFilter = !this.hasFilter;
    this.updateCommentsCountOverview();
  }

  sliderChange(evt: MatSliderChange) {
    this.fontSize = evt.value;
  }

  setTimePeriod(period: Period) {
    this.period = period;
    const currentTime = new Date();
    const hourInSeconds = 3600000;
    let periodInSeconds;
    if (period !== Period.all) {
      switch (period) {
        case Period.oneHour:
          periodInSeconds = hourInSeconds;
          break;
        case Period.threeHours:
          periodInSeconds = hourInSeconds * 2;
          break;
        case Period.oneDay:
          periodInSeconds = hourInSeconds * 24;
          break;
        case Period.oneWeek:
          periodInSeconds = hourInSeconds * 168;
          break;
        case Period.twoWeeks:
          periodInSeconds = hourInSeconds * 336;
          break;
      }
      this.commentsFilteredByTime = this.comments
        .filter(c => new Date(c.date).getTime() >= (currentTime.getTime() - periodInSeconds));
    } else {
      this.commentsFilteredByTime = this.comments;
    }
    if (this.filterFunction) {
      this.filter(this.filterIcon, this.isSvgIcon, this.filterTitle, this.filterDesc, this.filterFunction);
    } else {
      this.updateCommentsCountOverview();
    }
  }

}
