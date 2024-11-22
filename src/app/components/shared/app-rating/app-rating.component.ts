import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  computed,
  input,
  model,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NotificationService } from '../../../services/util/notification.service';
import { RatingService } from '../../../services/http/rating.service';
import { Rating } from '../../../models/rating';
import { RatingResult } from '../../../models/rating-result';
import { AppRatingPopUpComponent } from '../_dialogs/app-rating-pop-up/app-rating-pop-up.component';
import { ReplaySubject, filter, switchMap, take, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { user, user$ } from 'app/user/state/user';

@Component({
  selector: 'app-app-rating',
  templateUrl: './app-rating.component.html',
  styleUrls: ['./app-rating.component.scss'],
  standalone: false,
})
export class AppRatingComponent implements OnInit, OnDestroy {
  @Input() rating: Rating = undefined;
  @Input() onSuccess: (r: Rating) => void;
  mode = model<'dialog' | 'rating' | 'show'>('show');
  ratingResults = input<RatingResult>();
  @ViewChildren(MatIcon) children: QueryList<MatIcon>;
  protected people = computed(() => {
    const result = this.ratingResults();
    if (!result) {
      return '?';
    }
    return result.people.toLocaleString(language());
  });
  protected readonly i18n = i18n;
  private isSaving = false;
  private visibleRating = 0;
  private listeningToMove = true;
  private changedBySubscription = false;
  private destroyer = new ReplaySubject(1);

  constructor(
    private notificationService: NotificationService,
    private readonly ratingService: RatingService,
    private dialog: MatDialog,
  ) {}

  getIcon(index: number) {
    if (this.visibleRating >= index + 1) {
      return 'star_full';
    }
    return this.visibleRating > index ? 'star_half' : 'star_border';
  }

  getIconAccumulated(index: number) {
    const rating = Math.round(this.ratingResults().rating * 2) / 2;
    if (rating >= index + 1) {
      return 'star_full';
    }
    return rating > index ? 'star_half' : 'star_border';
  }

  ngOnInit(): void {
    user$
      .pipe(
        filter(Boolean),
        take(1),
        switchMap((user) => this.ratingService.getByAccountId(user.id)),
        takeUntil(this.destroyer),
      )
      .subscribe((r) => {
        if (r !== undefined && r !== null) {
          this.visibleRating = r.rating;
          this.changedBySubscription = true;
        } else {
          this.mode.set('rating');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next(1);
    this.destroyer.complete();
  }

  onClick(index: number, event: MouseEvent) {
    const elem = this.children.get(index)._elementRef.nativeElement;
    this.changedBySubscription = false;
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
    AppRatingPopUpComponent.openDialogAt(this.dialog, this.ratingResults());
  }

  save() {
    if (this.isSaving) {
      return;
    }
    if (this.changedBySubscription) {
      this.notificationService.show(i18n().retry);
      return;
    }
    this.isSaving = true;
    this.ratingService.create(user().id, this.visibleRating).subscribe({
      next: (r: Rating) => {
        this.notificationService.show(i18n().success);
        this.onSuccess?.(r);
        this.isSaving = false;
        this.rating = r;
        this.mode.set('show');
      },
      error: () => {
        this.notificationService.show(i18n().error);
        this.isSaving = false;
      },
    });
  }
}
