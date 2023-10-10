import {
  AfterContentInit,
  AfterViewInit,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-room-participant-page',
  templateUrl: './room-participant-page.component.html',
  styleUrls: [
    '../../creator/room-creator-page/room-creator-page.component.scss',
    './room-participant-page.component.scss',
  ],
})
export class RoomParticipantPageComponent
  extends RoomPageComponent
  implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
  constructor(
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    protected injector: Injector,
  ) {
    super(injector);
  }

  ngAfterViewInit() {
    this.tryInitNavigation();
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.initializeRoom();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('question_answer-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.liveAnnouncer.clear();
        this.liveAnnouncer.announce('Aktueller Raum-Code:' + this.room.shortId);
      } else if (
        KeyboardUtils.isKeyEvent(
          event,
          KeyboardKey.Escape,
          KeyboardKey.Digit9,
        ) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true
      ) {
        document.getElementById('question_answer-button').focus();
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  public announce() {
    this.liveAnnouncer.clear();
    const lang: string = this.translateService.currentLang;
    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Du befindest dich in der Sitzung' +
          this.room.name +
          'mit dem Raum-Code' +
          this.room.shortId +
          '.' +
          'Drücke die Taste 1 um eine Frage zu stellen, die Taste 2 für das Sitzungs-Menü, ' +
          'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
          'oder die Taste 9 um diese Ansage zu wiederholen.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'You have entered the session' +
          this.room.name +
          'with the room code' +
          this.room.shortId +
          '.' +
          'Press 0 to go back to the previous page, ' +
          '1 to ask a question, 2 for the session menu' +
          '8 to hear the current sesion code or 9 to repeat this announcement.',
      );
    }
  }

  preRoomLoadHook(): Observable<any> {
    if (!this.user) {
      return this.accountState.forceLogin().pipe(map((user) => user));
    } else {
      return of(this.user);
    }
  }

  postRoomLoadHook() {
    if (
      this.accountState.ensureAccess(
        this.room.shortId,
        this.room.id,
        UserRole.PARTICIPANT,
      )
    ) {
      this.roomService.addToHistory(this.room.id);
    }
    this.accountState.updateAccess(this.room.shortId);
  }
}
