import { Component, OnDestroy } from '@angular/core';
import {
  LivepollGroupContext,
  LivepollTemplateContext,
  templateContext,
  templateGroups,
} from '../../../../../models/livepoll-template';
import { FormControl } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../../../services/util/language.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { DeviceInfoService } from '../../../../../services/util/device-info.service';
import {
  LivepollService,
  LivepollSessionPatchAPI,
} from '../../../../../services/http/livepoll.service';
import { SessionService } from 'app/services/util/session.service';
import { LivepollSession } from '../../../../../models/livepoll-session';

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss'],
})
export class LivepollCreateComponent implements OnDestroy {
  public readonly templateGroups: LivepollGroupContext[] = templateGroups;

  public readonly translateKey = 'common';
  public templateSelection = new FormControl<LivepollTemplateContext>(
    templateContext[0],
  );

  public livepollConfiguration: LivepollSession;
  private _destroyer = new ReplaySubject(1);

  constructor(
    public readonly dialogRef: DialogRef<LivepollSessionPatchAPI>,
    public readonly translationService: TranslateService,
    public readonly languageService: LanguageService,
    public readonly http: HttpClient,
    public readonly device: DeviceInfoService,
    public readonly livepollService: LivepollService,
    private readonly sessionService: SessionService,
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
    this.livepollConfiguration = new LivepollSession({} as LivepollSession);
    console.log(this.templateGroups);
  }

  create() {
    this.dialogRef.close(this.livepollConfiguration);
    this.livepollService
      .create({
        roomId: this.sessionService.currentRoom.id,
        template: this.livepollConfiguration.template,
        title: this.livepollConfiguration.title,
        resultVisible: this.livepollConfiguration.resultVisible,
        viewsVisible: this.livepollConfiguration.viewsVisible,
      })
      .subscribe();
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }
}
