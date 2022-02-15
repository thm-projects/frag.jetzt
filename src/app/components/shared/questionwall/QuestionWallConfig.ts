import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Router } from '@angular/router';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomDataService } from '../../../services/util/room-data.service';
import { SessionService } from '../../../services/util/session.service';
import { FilterResult, RoomDataFilterService } from '../../../services/util/room-data-filter.service';
import { MatDialog } from '@angular/material/dialog';
import { QuestionWallKeyEventSupport } from './QuestionWallKeyEventSupport';
import { EscapeListener, Runnable } from './QuestionWallUtil';
import { Room } from '../../../models/room';
import { Rescale } from '../../../models/rescale';
import { ComponentLifecycleListener } from './ComponentLifecycleAdapter';
import { QuestionWallSessionData } from './QuestionWallSessionData';
import { QuestionWallGUIData } from './QuestionWallGUIData';
import { map } from 'rxjs/operators';

export const UPDATE_INTERVAL:number=15000;

export interface QuestionWallComment {
  comment: Comment;
}

export class QuestionWallConfig {

  private comments:QuestionWallComment[];
  private readonly keySupport:QuestionWallKeyEventSupport;
  private onKeyInitListener:Runnable[]=[];
  private room:Room;
  private sessionData:QuestionWallSessionData;
  private guiData:QuestionWallGUIData;

  constructor(
    private authenticationService: AuthenticationService,
    public router: Router,
    private commentService: CommentService,
    private wsCommentService: WsCommentService,
    private langService: LanguageService,
    private translateService: TranslateService,
    private roomDataService: RoomDataService,
    private sessionService: SessionService,
    private roomDataFilterService: RoomDataFilterService,
    private dialog: MatDialog,
    private listener: ComponentLifecycleListener
  ){
    this.keySupport = new QuestionWallKeyEventSupport();
    this.listener.onInit(()=>{
      this.onKeyInitListener.forEach(e=>e());
      this.sessionService.getRoomOnce().subscribe(room=>{
        this.room=room;
      });
      this.authenticationService.watchUser.subscribe(newUser => {
        if (newUser) {
          this.sessionData.user = newUser;
        }
      });
      this.sessionData.commentsObserver=this.roomDataFilterService.getData().pipe(
        map<FilterResult,QuestionWallComment[]>(e=>{
          return e.comments.map(c=>{
            return {
              comment: c
            };
          });
        })
      );
      this.sessionData.resolvedCommentsObserver.pipe(

      )
    //   this.sessionService.getRoomOnce().pipe(mergeMap(_ => this.roomDataService.receiveUpdates([
    //     { type: 'CommentCreated' }
    //   ]))).subscribe(c => {
    //     if (c.finished) {
    //       return;
    //     }
    //     this.unreadComments++;
    //     const date = new Date(c.comment.createdAt);
    //     // this.commentCache[c.comment.id] = {
    //     //   date,
    //     //   old: false,
    //     //   timeAgo: updateTimeAgo(new Date().getTime(), date.getTime())
    //     // };
    //   });
    });
    this.listener.onAfterViewInit(()=>{
      this.debug();
    });
    this.listener.onDestroy(()=>{
      this.keySupport.destroy();
      Rescale.exitFullscreen();
    });
  }

  public onKeyInit(e:(keySupport:QuestionWallKeyEventSupport)=>void){
    this.onKeyInitListener.push(()=>{
      e(this.keySupport);
    });
  }

  public runInterval(l:EscapeListener|Runnable,t:number){
    if(t < 0){
      console.error('runInterval(l:EscapeListener|Runnable,t:number) | t must be >= 0');
    }
    const clear=()=>{
      clearInterval(interval);
    };
    const interval=setInterval(()=>{
      l(()=>{
        clear();
      });
    },t);
    this.listener.onDestroy(()=>{
      clear();
    });
  }

  private debug() {
    console.log(this);
  }

}
