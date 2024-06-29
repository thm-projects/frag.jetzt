import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, Input, computed } from '@angular/core';
import { RatingResult } from '../../../../models/rating-result';
import { MatDialog } from '@angular/material/dialog';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-app-rating-pop-up',
  templateUrl: './app-rating-pop-up.component.html',
  styleUrls: ['./app-rating-pop-up.component.scss'],
})
export class AppRatingPopUpComponent {
  @Input()
  result: RatingResult;
  protected rating = computed(() => {
    return (
      this.result?.rating?.toLocaleString(language(), {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) || '?'
    );
  });
  protected people = computed(() => {
    return this.result?.people?.toLocaleString(language()) || '?';
  });
  protected readonly i18n = i18n;

  constructor() {}

  static openDialogAt(dialog: MatDialog, result: RatingResult) {
    dialog.open(AppRatingPopUpComponent, {
      width: '90vw',
      maxWidth: '500px',
      minWidth: 'min(90vw, 500px)',
      autoFocus: false,
    }).componentInstance.result = result;
  }

  getIconAccumulated(index: number) {
    const rating = Math.round(this.result.rating * 2) / 2;
    if (rating >= index + 1) {
      return 'star_full';
    }
    return rating > index ? 'star_half' : 'star_border';
  }
}
