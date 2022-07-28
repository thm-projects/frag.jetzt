import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MotdService } from '../../../services/http/motd.service';
import { NotificationService } from '../../../services/util/notification.service';

@Component({
  selector: 'app-create-motd',
  templateUrl: './create-motd.component.html',
  styleUrls: ['./create-motd.component.scss']
})
export class CreateMotdComponent implements OnInit {

  startDate: Date = new Date();
  endDate: Date = new Date(this.startDate.getTime() + 1_000 * 3_600 * 24 * 7);
  dateRange = new FormGroup({
    start: new FormControl(this.startDate),
    end: new FormControl(this.endDate),
  });
  langEntries = ['', '', ''];
  private isSending = false;

  constructor(
    private languageService: LanguageService,
    private translateService: TranslateService,
    private _adapter: DateAdapter<any>,
    private motdService: MotdService,
    private notification: NotificationService,
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
      this._adapter.setLocale(lang);
    });
  }

  ngOnInit(): void {
  }

  createEntry() {
    if (this.isSending) {
      return;
    }
    this.isSending = true;
    this.motdService.createMOTD({
      startTimestamp: this.dateRange.value.start,
      endTimestamp: this.dateRange.value.end,
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
      }
    }).subscribe({
      next: () => {
        this.translateService.get('create-motd.success')
          .subscribe(msg => this.notification.show(msg));
        this.isSending = false;
        this.langEntries = ['', '', ''];
        this.recreateTime();
      },
      error: () => {
        this.translateService.get('create-motd.error')
          .subscribe(msg => this.notification.show(msg));
        this.isSending = false;
      }
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
    const str = new Date(2345, 0, 11).toLocaleDateString(this.languageService.currentLanguage());
    return str.replace(/(\D|^)2345(\D|$)/, '$1YYYY$2')
      .replace(/(\D|^)11(\D|$)/, '$1MM$2')
      .replace(/(\D|^)\d*1(\D|$)/, '$1DD$2');
  }

}
