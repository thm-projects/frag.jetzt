import { Component, OnInit, AfterContentInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-moderator-comment-page',
  templateUrl: './moderator-comment-page.component.html',
  styleUrls: ['./moderator-comment-page.component.scss']
})
export class ModeratorCommentPageComponent implements OnInit, AfterContentInit {
  roomId: string;
  user: User;

  constructor(private route: ActivatedRoute,
              private notification: NotificationService,
              private authenticationService: AuthenticationService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2,
              public eventService: EventService) { }

  ngAfterContentInit(): void {
    setTimeout( () => {
      document.getElementById('live_announcer-button').focus();
    }, 500);
  }
  ngOnInit(): void {
    this.roomId = localStorage.getItem('roomId');
    this.user = this.authenticationService.getUser();
  }

  public announce() {
    this.liveAnnouncer.clear();
    this.liveAnnouncer.announce('', 'assertive');
  }

}
