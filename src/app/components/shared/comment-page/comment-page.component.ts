import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit, OnDestroy {
  roomId: string;
  shortId: string;
  user: User;

  listenerFn: () => void;

  constructor(private route: ActivatedRoute,
              private notification: NotificationService,
              private authenticationService: AuthenticationService,
              private eventService: EventService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2) { }

  ngOnInit(): void {
    this.roomId = localStorage.getItem('roomId');
    this.shortId = localStorage.getItem('shortId');
    this.user = this.authenticationService.getUser();
    this.announce();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (event.keyCode === 49 && this.eventService.focusOnInput === false) {
        if (document.getElementById('add_comment-button')) {
          document.getElementById('add_comment-button').focus();
        } else {
          document.getElementById('add_comment_small-button').focus();
        }
      } else if (event.keyCode === 51 && this.eventService.focusOnInput === false) {
        document.getElementById('searchBox').focus();
      } else if (event.keyCode === 52 && this.eventService.focusOnInput === false) {
        document.getElementById('sort-button').focus();
      } else if (event.keyCode === 53 && this.eventService.focusOnInput === false) {
        document.getElementById('filter-button').focus();
      } else if (event.keyCode === 56 && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.announce('Aktueller Sitzungs-Code:' + this.shortId.slice(0, 8));
      } else if ((event.keyCode === 57 || event.keyCode === 27) && this.eventService.focusOnInput === false) {
        this.announce();
      } else if (document.getElementById('search_close-button') && event.keyCode === 27
                 && this.eventService.focusOnInput === true) {
        document.getElementById('search_close-button').click();
      } else if (event.keyCode === 27 && this.eventService.focusOnInput === true) {
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
    this.liveAnnouncer.announce('Sie befinden sich auf der Kommentar-Seite Ihrer Sitzung. ' +
      'Drücken Sie die Taste 1 um eine Frage zu stellen, die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
      'die Taste 8 um den aktuellen Sitzungs-Code zu hören, die Taste 0 um zurück zur Benutzer-Seite zu gelangen. ' +
      'Sobald mehrere Fragen vorhanden sind, können Sie Fragen suchen und filtern. Mit Taste 3 gelangen Sie in das Suchfeld,' +
      'durch drücken der Escape-Taste wird die Sucheingabe gelöscht. Drücken Sie die Taste 4 um Fragen zu sortieren, ' +
      'oder die Taste 5 um Fragen zu filtern, oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }

}
