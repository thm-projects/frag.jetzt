import { AfterContentInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-comment-page',
  templateUrl: './comment-page.component.html',
  styleUrls: ['./comment-page.component.scss']
})
export class CommentPageComponent implements OnInit, OnDestroy, AfterContentInit {

  listenerFn: () => void;

  constructor(
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private notification: NotificationService,
    private authenticationService: AuthenticationService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2
  ) {
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 800);
  }

  ngOnInit(): void {
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (this.eventService.focusOnInput) {
        this.a11yCheckEventsOnFocus(event);
        return;
      }
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true) {
        this.a11yFocusAddCommentButton();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true) {
        document.getElementById('searchBox').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true) {
        this.a11yFocusSortButton();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit5) === true) {
        this.a11yFocusFilterButton();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true) {
        this.liveAnnouncer.clear();
        const lang: string = this.translateService.currentLang;
        if (lang === 'de') {
          this.liveAnnouncer.announce('Aktueller Sitzungs-' + document.getElementById('shortId-header').textContent);
        } else {
          this.liveAnnouncer.announce('Current Session-' + document.getElementById('shortId-header').textContent);
        }
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit9, KeyboardKey.Escape) === true) {
        this.announce();
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce('Du befindest dich auf der Fragen-Seite deiner Sitzung. ' +
        'Drücke die Taste 1 um eine Frage zu stellen, die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
        'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um zurück zur Benutzer-Seite zu gelangen. ' +
        'Sobald mehrere Fragen vorhanden sind kannst du Fragen suchen und filtern. Mit Taste 3 gelangst du in das Suchfeld,' +
        'durch drücken der Escape-Taste wird die Sucheingabe gelöscht. Drücke die Taste 4 um Fragen zu sortieren, ' +
        'die Taste 5 um Fragen zu filtern, oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
    } else {
      this.liveAnnouncer.announce('You are on the question page of your session. ' +
        'Press key 1 to ask a question, key 2 to enter the session menu, ' +
        'Press 8 to hear the current room code, press 0 to return to the user page. ' +
        'As soon as several questions are available you can search and filter questions. With key 3 you get to the search field,' +
        'Press the escape key to delete the search entry. Press the 4 key to sort questions, ' +
        'Press the 5 key to filter questions, or the 9 key to repeat this announcement', 'assertive');
    }
  }

  private a11yCheckEventsOnFocus(event: any) {
    if (!KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape)) {
      return;
    }
    if (document.getElementById('search_close-button')) {
      document.getElementById('search_close-button').click();
    } else if (document.getElementById('add_comment-button')) {
      document.getElementById('add_comment-button').focus();
      this.eventService.makeFocusOnInputFalse();
    } else {
      document.getElementById('add_comment_small-button').focus();
      this.eventService.makeFocusOnInputFalse();
    }
  }

  private a11yFocusAddCommentButton() {
    if (document.getElementById('add_comment-button')) {
      document.getElementById('add_comment-button').focus();
    } else {
      document.getElementById('add_comment_small-button').focus();
    }
  }

  private a11yFocusSortButton() {
    if (document.body.contains(document.getElementById('sort-button')) === false) {
      const lang: string = this.translateService.currentLang;
      this.liveAnnouncer.clear();
      if (lang === 'de') {
        this.liveAnnouncer.announce('Die Sortieroption steht zur Verfügung, sobald 3 oder mehr Fragen gestellt wurden.');
      } else {
        this.liveAnnouncer.announce('The sort option is available as soon as 3 or more questions have been asked.');
      }
    } else {
      document.getElementById('sort-button').focus();
    }
  }

  private a11yFocusFilterButton() {
    if (document.body.contains(document.getElementById('filter-button')) === false) {
      const lang: string = this.translateService.currentLang;
      this.liveAnnouncer.clear();
      if (lang === 'de') {
        this.liveAnnouncer.announce('Die Filteroption steht zur Verfügung, sobald 3 oder mehr Fragen gestellt wurden.');
      } else {
        this.liveAnnouncer.announce('The filter option is available as soon as 3 or more questions have been asked.');
      }
    } else {
      document.getElementById('filter-button').focus();
    }
  }
}
