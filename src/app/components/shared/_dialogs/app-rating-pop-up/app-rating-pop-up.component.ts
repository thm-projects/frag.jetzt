import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RatingResult } from '../../../../models/rating-result';
import { AppStateService } from 'app/services/state/app-state.service';

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

  constructor(private appState: AppStateService) {}

  static openDialogAt(
    dialog: MatDialog,
    ref: HTMLElement,
    result: RatingResult,
    below: boolean,
  ) {
    const rect = ref.getBoundingClientRect();
    dialog.open(AppRatingPopUpComponent, {
      position: {
        left: '50%',
        top: '50vh',
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
      this.appState.getCurrentLanguage(),
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      },
    );
    this.people = this.result.people.toLocaleString(
      this.appState.getCurrentLanguage(),
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
