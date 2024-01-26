import {
  AfterContentInit,
  AfterViewInit,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { RoomStateService } from 'app/services/state/room-state.service';
import { first } from 'rxjs';
import { QuotaService } from 'app/services/http/quota.service';
import { GPTRoomService } from 'app/services/http/gptroom.service';

@Component({
  selector: 'app-room-creator-page',
  templateUrl: './room-creator-page.component.html',
  styleUrls: ['./room-creator-page.component.scss'],
})
export class RoomCreatorPageComponent
  extends RoomPageComponent
  implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
  roomQuota = {
    spent: 0,
    limit: 0,
    spentAsPercentage: 0,
  };

  moderatorQuota = {
    spent: 0,
    limit: 0,
    spentAsPercentage: 0,
  };

  participantQuota = {
    spent: 0,
    limit: 0,
    spentAsPercentage: 0,
  };

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

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit() {
    this.injector
      .get(RoomStateService)
      .room$.pipe(first((e) => !!e))
      .subscribe((room) => {
        this.injector
          .get(GPTRoomService)
          .getByRoomId(room.id)
          .subscribe((gptRoom) => {
            const quotaService = this.injector.get(QuotaService);

            quotaService.get(gptRoom.roomQuotaId).subscribe((quota) => {
              if (quota.entries.length === 0) {
                return;
              }
              this.roomQuota.spent = quota.entries[0].counter / 10e7;
              this.roomQuota.limit = quota.entries[0].quota / 10e7;
              this.roomQuota.spentAsPercentage =
                (this.roomQuota.spent / this.roomQuota.limit) * 100;
            });

            quotaService.get(gptRoom.moderatorQuotaId).subscribe((quota) => {
              if (quota.entries.length === 0) {
                return;
              }
              this.moderatorQuota.spent = quota.entries[0].counter / 10e7;
              this.moderatorQuota.limit = quota.entries[0].quota / 10e7;
              this.moderatorQuota.spentAsPercentage =
                (this.moderatorQuota.spent / this.moderatorQuota.limit) * 100;
            });

            quotaService.get(gptRoom.participantQuotaId).subscribe((quota) => {
              if (quota.entries.length === 0) {
                return;
              }
              this.participantQuota.spent = quota.entries[0].counter / 10e7;
              this.participantQuota.limit = quota.entries[0].quota / 10e7;
              this.participantQuota.spentAsPercentage =
                (this.participantQuota.spent / this.participantQuota.limit) *
                100;
            });
          });
      });

    window.scroll(0, 0);
    this.initializeRoom();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      const lang: string = this.translateService.currentLang;
      if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('question_answer-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('gavel-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('settings-menu').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.liveAnnouncer.clear();
        if (lang === 'de') {
          this.liveAnnouncer.announce(
            'Aktueller Sitzungs-Name: ' +
              this.room.name +
              '. ' +
              'Aktueller Raum-Code: ' +
              this.room.shortId,
          );
        } else {
          this.liveAnnouncer.announce(
            'Current Session-Name: ' +
              this.room.name +
              '. ' +
              'Current Session Code: ' +
              this.room.shortId,
          );
        }
      } else if (
        KeyboardUtils.isKeyEvent(
          event,
          KeyboardKey.Digit9,
          KeyboardKey.Escape,
        ) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true
      ) {
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Du befindest dich in der von dir erstellten Sitzung. ' +
          'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
          'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
          'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
          'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
          'oder die Taste 9 um diese Ansage zu wiederholen.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'You are in the session you created. ' +
          'Press key 1 to go to the question overview, ' +
          'Press key 2 to open the session menu, key 3 to go to the moderation overview, ' +
          'Press key 4 to go to the session settings, ' +
          'Press the 8 for he current room code,  0 to go back, ' +
          'or press 9 to repeat this announcement.',
        'assertive',
      );
    }
  }
}
