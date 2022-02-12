import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Router } from '@angular/router';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomDataService } from '../../../services/util/room-data.service';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataFilterService } from '../../../services/util/room-data-filter.service';
import { MatDialog } from '@angular/material/dialog';
import { QuestionWallKeyEventSupport } from './QuestionWallKeyEventSupport';
import { Runnable } from './QuestionWallUtil';
import { Room } from '../../../models/room';


export class QuestionWallConfig {

  private comments:QuestionWallComment[];
  private readonly keySupport:QuestionWallKeyEventSupport;
  private onKeyInitListener:Runnable[];
  private room:Room;

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
    private dialog: MatDialog
  ){
    this.keySupport = new QuestionWallKeyEventSupport();
  }

  public onKeyInit(e:(keySupport:QuestionWallKeyEventSupport)=>void){
    this.onKeyInitListener.push(()=>{
      e(this.keySupport);
    });
  }

  public runOnInit(){
    this.runOnKeyInit();
    this.sessionService.getRoomOnce().subscribe(room=>{
      this.room=room;
    });
  }

  private runOnKeyInit(){
    this.onKeyInitListener.forEach(e=>e());
  }

  public runOnAfterViewInit(){
    this.debug();
  }

  public runOnDestroy(){
  }

  private debug() {
    console.log(this);
  }

}

export interface QuestionWallComment {
  comment: Comment;
  date:Date;
  dateToString:()=>string;
}
