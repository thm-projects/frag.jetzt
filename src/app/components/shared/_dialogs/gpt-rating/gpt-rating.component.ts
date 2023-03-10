import {
  Component,
  OnChanges,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RatingResult } from 'app/models/rating-result';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { AppRatingPopUpComponent } from '../app-rating-pop-up/app-rating-pop-up.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { Rating } from 'app/models/rating';
import { LanguageService } from 'app/services/util/language.service';
import { UserManagementService } from 'app/services/util/user-management.service';
import { GptService } from 'app/services/http/gpt.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'app/services/util/notification.service';
import { GPTRating } from 'app/models/gpt-rating';

@Component({
  selector: 'app-gpt-rating',
  templateUrl: './gpt-rating.component.html',
  styleUrls: ['./gpt-rating.component.scss'],
})
export class GptRatingComponent implements OnInit, OnChanges {
  @ViewChildren(MatIcon) children: QueryList<MatIcon>;
  popUpBelow = false;
  ratingResults: RatingResult = undefined;
  rating: GPTRating = undefined;
  people: string = '?';
  isLoading = true;
  readonly ratingTextMin = 2;
  readonly ratingTextMax = 30;
  ratingTextFormControl = new FormControl('', [
    Validators.minLength(this.ratingTextMin),
    Validators.maxLength(this.ratingTextMax),
  ]);
  private visibleRating = 0;
  private listeningToMove = true;
  private changedBySubscription = false;
  private isSaving = false;

  constructor(
    private deviceInfo: DeviceInfoService,
    private dialog: MatDialog,
    private languageService: LanguageService,
    private readonly userManagementService: UserManagementService,
    private gptService: GptService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private dialogRef: MatDialogRef<GptRatingComponent>,
  ) {}

  ngOnInit(): void {
    if (!this.canSubmit()) {
      return;
    }
    const subscription = this.userManagementService
      .getUser()
      .subscribe((user) => {
        this.gptService.getRating().subscribe((ratingResults) => {
          if (ratingResults !== undefined && ratingResults !== null) {
            this.rating = ratingResults;
            this.visibleRating = ratingResults.rating;
            this.changedBySubscription = true;
            this.ratingTextFormControl.setValue(ratingResults.ratingText);
            this.isLoading = false;
          }
        });
        setTimeout(() => subscription.unsubscribe());
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.canSubmit();
  }

  onMouseLeave() {
    this.listeningToMove = true;
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

  openPerMouse(target: HTMLElement) {
    if (this.deviceInfo.isCurrentlyMobile) {
      return;
    }
    this.openPopup(target);
  }

  openPopup(target: HTMLElement) {
    AppRatingPopUpComponent.openDialogAt(
      this.dialog,
      target,
      this.ratingResults,
      this.popUpBelow,
    );
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
    this.gptService
      .makeRating(this.visibleRating, this.ratingTextFormControl.value)
      .subscribe((rating) => {
        this.rating = rating;
        this.ratingTextFormControl.setValue(rating.ratingText);
        this.visibleRating = rating.rating;
        this.isSaving = false;
      });
    this.dialogRef.close();
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
        this.languageService.currentLanguage() ?? undefined,
      );
      return false;
    }
    return true;
  }
}
