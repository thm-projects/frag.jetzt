import { I18nLoader } from 'app/base/i18n/i18n-loader';
import rawI18n from './i18n.json';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RatingResult } from 'app/models/rating-result';
import { RatingService } from 'app/services/http/rating.service';
import { Subscription } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { EventService } from 'app/services/util/event.service';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-first-time-user',
  templateUrl: './first-time-user.component.html',
  styleUrl: './first-time-user.component.scss',
})
export class FirstTimeUserComponent implements OnInit, OnDestroy {
  accumulatedRatings: RatingResult;
  protected readonly i18n = i18n;
  private eventSubscription: Subscription[] = [];

  constructor(
    private ratingService: RatingService,
    public dialogRef: MatDialogRef<FirstTimeUserComponent>,
    private eventService: EventService,
  ) {}

  ngOnInit() {
    this.ratingService.getRatings().subscribe((r) => {
      this.accumulatedRatings = r;
    });

    this.eventSubscription.push(
      this.eventService.on('dialogClosed').subscribe(() => {
        this.dialogRef.close();
      }),
      this.eventService.on('roomJoined').subscribe(() => {
        this.dialogRef.close();
      }),
    );
  }

  ngOnDestroy() {
    this.eventSubscription.forEach((s) => s.unsubscribe());
  }
}
