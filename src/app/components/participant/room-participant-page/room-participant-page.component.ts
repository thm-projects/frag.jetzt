import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-room-participant-page',
  templateUrl: './room-participant-page.component.html',
  styleUrls: ['./room-participant-page.component.scss']
})
export class RoomParticipantPageComponent extends RoomPageComponent implements OnInit {

  room: Room;
  isLoading = true;
  deviceType = localStorage.getItem('deviceType');
  user: User;


  constructor(protected location: Location,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              private authenticationService: AuthenticationService,
              private liveAnnouncer: LiveAnnouncer) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.announce();
  }

  public announce() {
    // this.liveAnnouncer.announce('Willkommen auf dieser Seite' + document.getElementById('announcer_text').textContent, 'assertive');
    this.liveAnnouncer.announce('Sie befinden sich nun in der Session mit der von Ihnen eingegebenen ID.', 'assertive');
  }

  afterRoomLoadHook() {
    this.authenticationService.watchUser.subscribe( user => this.user = user);
    if (!this.user) {
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(guestUser => {
        this.roomService.addToHistory(this.room.id);
      });
    }
  }
}
