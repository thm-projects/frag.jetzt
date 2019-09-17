import { Component, OnInit, OnDestroy, Renderer2, AfterContentInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit, OnDestroy, AfterContentInit {
  roomId: string;
  user: User;

  listenerFn: () => void;

  constructor(private route: ActivatedRoute,
              private notification: NotificationService,
              private authenticationService: AuthenticationService,
              private eventService: EventService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2) { }

  ngAfterContentInit(): void {
    setTimeout( () => {
      document.getElementById('live_announcer-button').focus();
    }, 800);
  }
  ngOnInit(): void {
    this.roomId = localStorage.getItem('roomId');
    this.user = this.authenticationService.getUser();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        if (document.getElementById('add_comment-button')) {
          document.getElementById('add_comment-button').focus();
        } else {
          document.getElementById('add_comment_small-button').focus();
        }
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('searchBox').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true && this.eventService.focusOnInput === false) {
        document.getElementById('sort-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit5) === true && this.eventService.focusOnInput === false) {
        document.getElementById('filter-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.clear();
        this.liveAnnouncer.announce('Aktueller Sitzungs-' + document.getElementById('shortId-header').textContent);
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit9, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (
        document.getElementById('search_close-button') &&
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true
      ) {
        document.getElementById('search_close-button').click();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true) {
        if (document.getElementById('add_comment-button')) {
          document.getElementById('add_comment-button').focus();
          this.eventService.makeFocusOnInputFalse();
        } else {
          document.getElementById('add_comment_small-button').focus();
          this.eventService.makeFocusOnInputFalse();
        }
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
  }

  public announce() {
    this.liveAnnouncer.clear();
    this.liveAnnouncer.announce('Du befindest dich auf der Fragen-Seite deiner Sitzung. ' +
      'Drücke die Taste 1 um eine Frage zu stellen, die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
      'die Taste 8 um den aktuellen Sitzungs-Code zu hören, die Taste 0 um zurück zur Benutzer-Seite zu gelangen. ' +
      'Sobald mehrere Fragen vorhanden sind kannst du Fragen suchen und filtern. Mit Taste 3 gelangst du in das Suchfeld,' +
      'durch drücken der Escape-Taste wird die Sucheingabe gelöscht. Drücke die Taste 4 um Fragen zu sortieren, ' +
      'die Taste 5 um Fragen zu filtern, oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }

}
