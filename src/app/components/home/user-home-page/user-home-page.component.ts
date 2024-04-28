import {
  AfterContentInit,
  Component,
  ComponentRef,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
  inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from '../../../models/user-roles.enum';
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
import { AppRatingComponent } from '../../shared/app-rating/app-rating.component';
import { SessionService } from '../../../services/util/session.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { forkJoin, ReplaySubject, takeUntil } from 'rxjs';
import { MultiLevelDialogComponent } from 'app/components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_ROOM_CREATE } from 'app/components/shared/_dialogs/room-create/room-create.multi-level';
import { generateRoom } from 'app/components/shared/_dialogs/room-create/room-create.executor';
import { MatDialog } from '@angular/material/dialog';
import { GPTAPISettingService } from 'app/services/http/gptapisetting.service';
import { GPTVoucherService } from 'app/services/http/gptvoucher.service';
import { getDefaultTemplate } from 'app/navigation/default-navigation';
import { NAVIGATION } from 'modules/navigation/m3-navigation-emitter';

@Component({
  selector: 'app-user-home-page',
  templateUrl: './user-home-page.component.html',
  styleUrls: ['./user-home-page.component.scss'],
})
export class UserHomePageComponent
  implements OnInit, OnDestroy, AfterContentInit {
  user: User;
  creatorRole: UserRole = UserRole.CREATOR;
  participantRole: UserRole = UserRole.PARTICIPANT;
  canRate: boolean = Boolean(localStorage.getItem('comment-created'));
  loadingRatings: boolean = true;
  fetchedRating: Rating = undefined;
  listenerFn: () => void;
  accumulatedRatings: RatingResult = undefined;
  private _list: ComponentRef<unknown>[];
  private destroyer = new ReplaySubject(1);
  private injector = inject(Injector);

  constructor(
    public dialog: MatDialog,
    private translateService: TranslateService,
    private accountState: AccountStateService,
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
    getDefaultTemplate(this.injector).subscribe((template) => {
      NAVIGATION.set(template);
    });
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit() {
    this.accountState
      .forceLogin()
      .pipe(takeUntil(this.destroyer))
      .subscribe((newUser) => {
        this.user = newUser;
        if (
          this.fetchedRating === undefined &&
          this.user !== undefined &&
          this.user !== null
        ) {
          this.fetchedRating = null;
          this.ratingService.getByAccountId(this.user.id).subscribe((r) => {
            if (r !== null) {
              this.onRate(r);
            } else if (!this.canRate) {
              this.onRate(new Rating(this.user.id, 0));
            } else {
              this.loadingRatings = false;
            }
          });
        }
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
    this._list?.forEach((e) => e.destroy());
    this.listenerFn();
  }

  onRate(r: Rating) {
    this.fetchedRating = r;
    this.ratingService.getRatings().subscribe((ratings) => {
      this.accumulatedRatings = ratings;
      this.initNavigation();
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

  private initNavigation() {
    if (this._list || !this.headerService.isActive) {
      return;
    }
    this._list = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'star',
          class: 'material-icons-outlined',
          isSVGIcon: false,
          text: 'home-page.app-rating',
          callback: () => {
            const dialogRef = this.dialog.open(AppRatingComponent);
            dialogRef.componentInstance.rating = this.fetchedRating;
            dialogRef.componentInstance.onSuccess = (r: Rating) => {
              dialogRef.close();
              this.onRate(r);
            };
          },
          condition: () =>
            this.fetchedRating !== null && this.fetchedRating !== undefined,
        });
      },
    );
  }
}
