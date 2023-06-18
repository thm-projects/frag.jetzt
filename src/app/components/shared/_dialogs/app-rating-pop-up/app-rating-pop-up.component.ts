import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RatingResult } from '../../../../models/rating-result';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-app-rating-pop-up',
  templateUrl: './app-rating-pop-up.component.html',
  styleUrls: ['./app-rating-pop-up.component.scss'],
})
export class AppRatingPopUpComponent implements OnInit {
  @Input()
  result: RatingResult;
  rating: string = '?';
  people: string = '?';

  constructor(private languageService: LanguageService) {}

  static openDialogAt(
    dialog: MatDialog,
    ref: HTMLElement,
    result: RatingResult,
    below: boolean,
  ) {
    const rect = ref.getBoundingClientRect();
    dialog.open(AppRatingPopUpComponent, {
      position: {
        left: rect.left + rect.width + 'px',
        top: below ? rect.bottom + 'px' : rect.top + 'px',
      },
      width: '90vw',
      maxWidth: '500px',
      panelClass: 'ratingContainer' + (below ? '-below' : ''),
      minWidth: 'min(90vw, 500px)',
      autoFocus: false,
    }).componentInstance.result = result;
  }

  ngOnInit(): void {
    this.rating = this.result.rating.toLocaleString(
      this.languageService.currentLanguage(),
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
    );
    this.people = this.result.people.toLocaleString(
      this.languageService.currentLanguage(),
    );
  }

  getIconAccumulated(index: number) {
    const rating = Math.round(this.result.rating * 2) / 2;
    if (rating >= index + 1) {
      return 'star_full';
    }
    return rating > index ? 'star_half' : 'star_border';
  }
}
