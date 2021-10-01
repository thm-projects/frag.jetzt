import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CommentService } from '../../../services/http/comment.service';
import { EventService } from '../../../services/util/event.service';
import { IMessage, Message } from '@stomp/stompjs';
import { Observable, of, Subscription } from 'rxjs';
import { RoomPageEdit } from './room-page-edit/room-page-edit';
import { CommentSettingsDialog } from '../../../models/comment-settings-dialog';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit, OnDestroy, AfterViewInit {
  room: Room = null;
  isLoading = true;
  commentCounter: number;
  protected moderationEnabled = true;
  protected sub: Subscription;
  protected commentWatch: Observable<IMessage>;
  protected listenerFn: () => void;
  public commentCounterEmit: EventEmitter<number> = new EventEmitter<number>();
  public onDestroyListener: EventEmitter<void> = new EventEmitter<void>();
  public onAfterViewInitListener: EventEmitter<void> = new EventEmitter<void>();
  public onInitListener: EventEmitter<void> = new EventEmitter<void>();
  public encodedShortId:string;
  public roomPageEdit:RoomPageEdit;
  public viewModuleCount = 1;

  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute,
              protected location: Location,
              protected wsCommentService: WsCommentService,
              protected commentService: CommentService,
              protected eventService: EventService,
              protected dialog:MatDialog,
              protected translate:TranslateService,
              protected bonusTokenService:BonusTokenService,
              protected headerService:HeaderService,
              protected composeService:ArsComposeService,
              protected notification:NotificationService,
              protected authenticationService:AuthenticationService
  ) {
    this.roomPageEdit=new RoomPageEdit(
      dialog,
      translate,
      notification,
      roomService,
      eventService,
      location,
      commentService,
      bonusTokenService,
      headerService,
      composeService,
      authenticationService,
      route,
      {
        onInitListener:this.onInitListener,
        onAfterViewInitListener:this.onAfterViewInitListener,
        onDestroyListener:this.onDestroyListener,
        updateCommentSettings(settings: CommentSettingsDialog){
          this.updateCommentSettings(settings);
        }
      }
    );
  }

  ngAfterViewInit(){
    this.onAfterViewInitListener.emit();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.initializeRoom(params['shortId']);
      this.encodedShortId = params['shortId'];
    });
    this.onInitListener.emit();
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.onDestroyListener.emit();
  }

  protected preRoomLoadHook(): Observable<any> {
    return of('');
  }

  protected postRoomLoadHook() {

  }

  initializeRoom(id: string): void {
    this.preRoomLoadHook().subscribe(user => {
      this.roomService.getRoomByShortId(id).subscribe(room => {
        this.room = room;
        this.isLoading = false;
        this.moderationEnabled = !this.room.directSend;
        localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
        this.commentService.countByRoomId(this.room.id, true)
          .subscribe(commentCounter => {
            this.setCommentCounter(commentCounter);
          });
        this.commentWatch = this.wsCommentService.getCommentStream(this.room.id);
        this.sub = this.commentWatch.subscribe((message: Message) => {
          const msg = JSON.parse(message.body);
          const payload = msg.payload;
          if (msg.type === 'CommentCreated') {
            this.setCommentCounter(this.commentCounter + 1);
          } else if (msg.type === 'CommentDeleted') {
            this.setCommentCounter(this.commentCounter - 1);
          }
        });
        this.postRoomLoadHook();
      });
    });
  }

  setCommentCounter(commentCounter: number) {
    this.commentCounter = commentCounter;
    this.commentCounterEmit.emit(this.commentCounter);
  }

  delete(room: Room): void {
    this.roomService.deleteRoom(room.id).subscribe();
    this.location.back();
  }

  updateCommentSettings(settings: CommentSettingsDialog){
    this.room.tags = settings.tags;
    if (this.moderationEnabled && !settings.enableModeration){
      this.viewModuleCount = this.viewModuleCount - 1;
    }else if (!this.moderationEnabled && settings.enableModeration){
      this.viewModuleCount = this.viewModuleCount + 1;
    }
    this.moderationEnabled = settings.enableModeration;
    localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
  }
}
