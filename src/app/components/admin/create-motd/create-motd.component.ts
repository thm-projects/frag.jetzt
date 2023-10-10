import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MotdService } from '../../../services/http/motd.service';
import { NotificationService } from '../../../services/util/notification.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-create-motd',
  templateUrl: './create-motd.component.html',
  styleUrls: ['./create-motd.component.scss'],
})
export class CreateMotdComponent implements OnInit, OnDestroy {
  startDate: Date = new Date();
  endDate: Date = new Date(this.startDate.getTime() + 1_000 * 3_600 * 24 * 7);
  dateRange = new FormGroup({
    start: new FormControl(this.startDate),
    end: new FormControl(this.endDate),
  });
  langEntries = ['', '', ''];
  private isSending = false;
  private _destroyer = new ReplaySubject(1);

  constructor(
    private translateService: TranslateService,
    private _adapter: DateAdapter<any>,
    private motdService: MotdService,
    private notification: NotificationService,
    private appState: AppStateService,
  ) {
    this.appState.language$
      .pipe(takeUntil(this._destroyer))
      .subscribe((lang) => {
        this._adapter.setLocale(lang);
      });
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
  }

  createEntry() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    const startDate = this.dateRange.value.start as Date;
    const endDate = this.dateRange.value.end as Date;
    startDate.setHours(
      this.startDate.getHours(),
      this.startDate.getMinutes(),
      0,
      0,
    );
    endDate.setHours(this.endDate.getHours(), this.endDate.getMinutes(), 0, 0);
    this.motdService
      .createMOTD({
        startTimestamp: startDate,
        endTimestamp: endDate,
        messages: {
          de: {
            language: 'de',
            message: this.langEntries[1],
          },
          en: {
            language: 'en',
            message: this.langEntries[0],
          },
          fr: {
            language: 'fr',
            message: this.langEntries[2],
          },
        },
      })
      .subscribe({
        next: () => {
          this.translateService
            .get('create-motd.success')
            .subscribe((msg) => this.notification.show(msg));
          this.isSending = false;
          this.langEntries = ['', '', ''];
          this.recreateTime();
        },
        error: () => {
          this.translateService
            .get('create-motd.error')
            .subscribe((msg) => this.notification.show(msg));
          this.isSending = false;
        },
      });
  }

  recreateTime() {
    this.startDate = new Date();
    this.endDate = new Date(this.startDate.getTime() + 1_000 * 3_600 * 24 * 7);
    this.dateRange.setValue({
      start: this.startDate,
      end: this.endDate,
    });
  }

  getDateFormatString() {
    const str = new Date(2345, 0, 11).toLocaleDateString(
      this.appState.getCurrentLanguage(),
    );
    return str
      .replace(/(\D|^)2345(\D|$)/, '$1YYYY$2')
      .replace(/(\D|^)11(\D|$)/, '$1MM$2')
      .replace(/(\D|^)\d*1(\D|$)/, '$1DD$2');
  }
}
