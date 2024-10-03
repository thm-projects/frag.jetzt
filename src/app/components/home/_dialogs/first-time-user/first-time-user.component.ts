import { I18nLoader } from 'app/base/i18n/i18n-loader';
import rawI18n from './i18n.json';
import { Component, OnInit } from '@angular/core';
import { RatingResult } from 'app/models/rating-result';
import { RatingService } from 'app/services/http/rating.service';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-first-time-user',
  templateUrl: './first-time-user.component.html',
  styleUrl: './first-time-user.component.scss',
})
export class FirstTimeUserComponent implements OnInit {
  accumulatedRatings: RatingResult;
  protected readonly i18n = i18n;

  constructor(private ratingService: RatingService) {}

  ngOnInit() {
    this.ratingService.getRatings().subscribe((r) => {
      this.accumulatedRatings = r;
    });
  }
}
