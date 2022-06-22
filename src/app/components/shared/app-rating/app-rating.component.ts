import { Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NotificationService } from '../../../services/util/notification.service';
import { LanguageService } from '../../../services/util/language.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { RatingService } from '../../../services/http/rating.service';
import { TranslateService } from '@ngx-translate/core';
import { Rating } from '../../../models/rating';
import { RatingResult } from '../../../models/rating-result';

@Component({
  selector: 'app-app-rating',
  templateUrl: './app-rating.component.html',
  styleUrls: ['./app-rating.component.scss']
})
export class AppRatingComponent implements OnInit, OnChanges {

  @Input() rating: Rating = undefined;
  @Input() onSuccess: (r: Rating) => void;
  @Input() ratingResults: RatingResult = undefined;
  @ViewChildren(MatIcon) children: QueryList<MatIcon>;
  people: number = 0;
  private isSaving = false;
  private visibleRating = 0;
  private listeningToMove = true;
  private changedBySubscription = false;

  constructor(
    private languageService: LanguageService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private readonly authenticationService: AuthenticationService,
    private readonly ratingService: RatingService,
  ) {
    this.languageService.getLanguage().subscribe(lang => this.translateService.use(lang));
  }

  getIcon(index: number) {
    if (this.visibleRating >= index + 1) {
      return 'star_full';
    }
    return this.visibleRating > index ? 'star_half' : 'star_border';
  }

  ngOnInit(): void {
    if (!this.canSubmit()) {
      return;
    }
    const subscription = this.authenticationService.watchUser.subscribe(user => {
      this.ratingService.getByAccountId(user.id).subscribe(r => {
        if (r !== undefined && r !== null) {
          this.visibleRating = r.rating;
          this.changedBySubscription = true;
        }
      });
      setTimeout(() => subscription.unsubscribe());
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.canSubmit();
  }

  onClick(index: number, event: MouseEvent) {
    const elem = this.children.get(index)._elementRef.nativeElement;
    if (this.listeningToMove || this.visibleRating < index || this.visibleRating > index + 1) {
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
    elem.addEventListener('animationend', () => {
      elem.classList.remove('bounce');
    }, { once: true });
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

  save() {
    if (this.isSaving) {
      return;
    }
    if (this.changedBySubscription) {
      this.translateService.get('app-rating.retry')
        .subscribe(msg => this.notificationService.show(msg));
      return;
    }
    this.isSaving = true;
    this.ratingService.create(this.authenticationService.getUser().id, this.visibleRating)
      .subscribe({
        next: (r: Rating) => {
          this.translateService.get('app-rating.success')
            .subscribe(msg => this.notificationService.show(msg));
          this.onSuccess?.(r);
          this.isSaving = false;
        },
        error: () => {
          this.translateService.get('app-rating.error')
            .subscribe(msg => this.notificationService.show(msg));
          this.isSaving = false;
        }
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
      this.people = this.ratingResults.people;
      return false;
    }
    return true;
  }

}
