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
import { GPTRoomService } from 'app/services/http/gptroom.service';
import { QuotaService } from 'app/services/http/quota.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-room-moderator-page',
  templateUrl: './room-moderator-page.component.html',
  styleUrls: [
    '../../creator/room-creator-page/room-creator-page.component.scss',
    './room-moderator-page.component.scss',
  ],
})
export class RoomModeratorPageComponent
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
    protected override injector: Injector,
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

  override ngOnDestroy() {
    super.ngOnDestroy();
  }

  override ngOnInit() {
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
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.liveAnnouncer.clear();
        this.liveAnnouncer.announce(
          'Aktueller Sitzungs-Name: ' +
            this.room.name +
            '. ' +
            'Aktueller Raum-Code: ' +
            this.room.shortId,
        );
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
        document.getElementById('question_answer-button').focus();
      }
    });
  }

  public announce() {
    this.liveAnnouncer.announce(
      'Du befindest dich in der Sitzung in der du als Moderator gewählt wurdest. ' +
        'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
        'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
        'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
        'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
        'oder die Taste 9 um diese Ansage zu wiederholen.',
      'assertive',
    );
  }
}
