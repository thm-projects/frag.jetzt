import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';
import {
  defaultLivepollConfiguration,
  LivepollConfiguration,
} from '../../../../models/livepoll-configuration';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../models/livepoll-template';
import { ReplaySubject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-livepoll-dialog',
  templateUrl: './livepoll-dialog.component.html',
  styleUrls: [
    './livepoll-dialog.component.scss',
    '../livepoll-create/livepoll-create.component.scss',
  ],
})
export class LivepollDialogComponent implements OnInit, OnDestroy {
  userRole: UserRole;
  livepollConfiguration!: LivepollConfiguration;
  template: LivepollTemplateContext;
  translateKey: string = 'create';
  selectedPreviewOption: number = -1;
  private _destroyer = new ReplaySubject(1);

  constructor(
    public readonly device: DeviceInfoService,
    public readonly languageService: LanguageService,
    public readonly translationService: TranslateService,
    public readonly http: HttpClient,
  ) {
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this._destroyer))
      .subscribe((lang) => {
        this.translationService.use(lang);
        this.http
          .get('/assets/i18n/livepoll/' + lang + '.json')
          .subscribe((translation) => {
            this.translationService.setTranslation(lang, translation, true);
          });
      });
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {
    this._destroyer.next(0);
  }
}
