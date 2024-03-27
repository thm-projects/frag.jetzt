import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NotificationService } from '../../../services/util/notification.service';
import { RatingService } from '../../../services/http/rating.service';
import { TranslateService } from '@ngx-translate/core';
import { Rating } from '../../../models/rating';
import { RatingResult } from '../../../models/rating-result';
import { AppRatingPopUpComponent } from '../_dialogs/app-rating-pop-up/app-rating-pop-up.component';
import { AccountStateService } from 'app/services/state/account-state.service';
import { ReplaySubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-app-rating',
  templateUrl: './app-rating.component.html',
  styleUrls: ['./app-rating.component.scss'],
})
export class AppRatingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() rating: Rating = undefined;
  @Input() onSuccess: (r: Rating) => void;
  @Input() ratingResults: RatingResult = undefined;
  @ViewChildren(MatIcon) children: QueryList<MatIcon>;
  people: string = '?';
  private isSaving = false;
  private visibleRating = 0;
  private listeningToMove = true;
  private changedBySubscription = false;
  private destroyer = new ReplaySubject(1);

  constructor(
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private readonly accountState: AccountStateService,
    private readonly ratingService: RatingService,
    private dialog: MatDialog,
    private appState: AppStateService,
  ) {}

  getIcon(index: number) {
    if (this.visibleRating >= index + 1) {
      return 'star_full';
    }
    return this.visibleRating > index ? 'star_half' : 'star_border';
  }

  getIconAccumulated(index: number) {
    const rating = Math.round(this.visibleRating * 2) / 2;
    if (rating >= index + 1) {
      return 'star_full';
    }
    return rating > index ? 'star_half' : 'star_border';
  }

  ngOnInit(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.accountState.user$
      .pipe(
        filter((v) => Boolean(v)),
        take(1),
        switchMap((user) => this.ratingService.getByAccountId(user.id)),
        takeUntil(this.destroyer),
      )
      .subscribe((r) => {
        if (r !== undefined && r !== null) {
          this.visibleRating = r.rating;
          this.changedBySubscription = true;
        }
      });
  }

  ngOnChanges() {
    this.canSubmit();
  }

  ngOnDestroy(): void {
    this.destroyer.next(1);
    this.destroyer.complete();
  }

  onClick(index: number, event: MouseEvent) {
    const elem = this.children.get(index)._elementRef.nativeElement;
    if (
      this.listeningToMove ||
      this.visibleRating < index ||
      this.visibleRating > index + 1
    ) {
      this.listeningToMove = false;
      const x = Math.trunc(event.offsetX / (elem.clientWidth / 3));
      this.visibleRating = index + x / 2;
    } else {
      this.visibleRating += 0.5;
      if (this.visibleRating > index + 1) {
        this.visibleRating = index;
      }
    }
    elem.classList.add('bounce');
    elem.addEventListener(
      'animationend',
      () => {
        elem.classList.remove('bounce');
      },
      { once: true },
    );
  }

  onMouseMove(index: number, event: MouseEvent) {
    this.changedBySubscription = false;
    if (!this.listeningToMove) {
      return;
    }
    const elem = this.children.get(index)._elementRef.nativeElement;
    const x = Math.trunc(event.offsetX / (elem.clientWidth / 3));
    this.visibleRating = index + x / 2;
  }

  onMouseLeave() {
    this.listeningToMove = true;
  }

  openPopup() {
    AppRatingPopUpComponent.openDialogAt(this.dialog, this.ratingResults);
  }

  save() {
    if (this.isSaving) {
      return;
    }
    if (this.changedBySubscription) {
      this.translateService
        .get('app-rating.retry')
        .subscribe((msg) => this.notificationService.show(msg));
      return;
    }
    this.isSaving = true;
    this.ratingService
      .create(this.accountState.getCurrentUser().id, this.visibleRating)
      .subscribe({
        next: (r: Rating) => {
          this.translateService
            .get('app-rating.success')
            .subscribe((msg) => this.notificationService.show(msg));
          this.onSuccess?.(r);
          this.isSaving = false;
        },
        error: () => {
          this.translateService
            .get('app-rating.error')
            .subscribe((msg) => this.notificationService.show(msg));
          this.isSaving = false;
        },
      });
  }

  private canSubmit(): boolean {
    if (this.rating !== undefined) {
      this.visibleRating = this.rating?.rating || 0;
      this.changedBySubscription = this.rating !== null;
      return false;
    }
    if (this.ratingResults !== undefined) {
      this.visibleRating = this.ratingResults.rating;
      this.people = this.ratingResults.people.toLocaleString(
        this.appState.getCurrentLanguage() ?? undefined,
      );
      return false;
    }
    return true;
  }
}
