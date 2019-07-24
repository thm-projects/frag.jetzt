import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';

@Component({
  selector: 'app-room-moderator-page',
  templateUrl: './room-moderator-page.component.html',
  styleUrls: ['./room-moderator-page.component.scss']
})
export class RoomModeratorPageComponent extends RoomPageComponent implements OnInit {

  room: Room;
  isLoading = true;
  deviceType = localStorage.getItem('deviceType');


  constructor(protected location: Location,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
  }
}
