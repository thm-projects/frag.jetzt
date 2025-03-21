import {
  AfterContentInit,
  Component,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { User } from '../../../models/user';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { RatingService } from '../../../services/http/rating.service';
import { Rating } from '../../../models/rating';
import { RatingResult } from '../../../models/rating-result';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { SessionService } from '../../../services/util/session.service';
import { forkJoin, ReplaySubject, takeUntil } from 'rxjs';
import { MultiLevelDialogComponent } from 'app/components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_ROOM_CREATE } from 'app/components/shared/_dialogs/room-create/room-create.multi-level';
import { generateRoom } from 'app/components/shared/_dialogs/room-create/room-create.executor';
import { MatDialog } from '@angular/material/dialog';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';
import { GPTVoucherService } from 'app/services/http/gptvoucher.service';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import { ensureLoggedIn } from 'app/user/state/user';

@Component({
  selector: 'app-user-home-page',
  templateUrl: './user-home-page.component.html',
  styleUrls: ['./user-home-page.component.scss'],
  standalone: false,
})
export class UserHomePageComponent
  implements OnInit, OnDestroy, AfterContentInit {
  user: User;
  canRate: boolean = Boolean(localStorage.getItem('comment-created'));
  loadingRatings: boolean = true;
  fetchedRating: Rating = undefined;
  listenerFn: () => void;
  accumulatedRatings: RatingResult = undefined;
  private destroyer = new ReplaySubject(1);
  private injector = inject(Injector);

  constructor(
    public dialog: MatDialog,
    private translateService: TranslateService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    private readonly ratingService: RatingService,
    protected headerService: HeaderService,
    protected composeService: ArsComposeService,
    public sessionService: SessionService,
    private keyService: GPTAPISettingService,
    private voucherService: GPTVoucherService,
  ) {
    this.initM3Navigation();
  }

  initM3Navigation() {
    applyDefaultNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit() {
    ensureLoggedIn()
      .pipe(takeUntil(this.destroyer))
      .subscribe((user) => {
        this.user = user;
        this.fetchedRating = null;
        this.loadingRatings = true;
        this.ratingService.getByAccountId(this.user.id).subscribe((r) => {
          if (r !== null) {
            this.onRate(r);
          } else if (!this.canRate) {
            this.onRate(new Rating(this.user.id, 0));
          } else {
            this.loadingRatings = false;
          }
        });
      });
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('session_id-input').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('create_session-button').focus();
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
        document.getElementById('session_enter-button').focus();
      }
    });
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
    this.listenerFn();
  }

  onRate(r: Rating) {
    this.fetchedRating = r;
    this.ratingService.getRatings().subscribe((ratings) => {
      this.accumulatedRatings = ratings;
      this.loadingRatings = false;
    });
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Du befindest dich auf deiner Benutzer-Seite. ' +
          'Drücke die Taste 1 um einen Raum-Code einzugeben, die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
          'die Taste 3 um eine neue Sitzung zu erstellen, die Taste 0 um zurück zur Startseite zu gelangen, ' +
          'oder die Taste 9 um diese Ansage zu wiederholen.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'You are on your user page.' +
          'Press 1 to enter a room code, key 2 to enter the session menu, ' +
          'key 3 to create a new session, key 0 to go back to the start page, ' +
          'or press the 9 key to repeat this announcement.',
        'assertive',
      );
    }
  }

  openCreateRoomDialog(): void {
    forkJoin([
      this.keyService.getKeys(),
      this.voucherService.getVouchers(),
    ]).subscribe(([apiKeys, vouchers]) => {
      MultiLevelDialogComponent.open(
        this.dialog,
        MULTI_LEVEL_ROOM_CREATE,
        generateRoom,
        {
          apiKeys,
          vouchers,
        },
      );
    });
  }
}
