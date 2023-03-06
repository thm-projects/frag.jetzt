import { Component, EventEmitter, OnDestroy } from '@angular/core';
import {
  LivepollTemplate,
  LivepollTemplateContext,
  templateContext,
  templateGroups,
} from '../../../../models/livepoll-template';
import { FormControl } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import {
  defaultLivepollConfiguration,
  LivepollConfiguration,
} from '../../../../models/livepoll-configuration';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../../services/util/language.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import { MatDialog } from '@angular/material/dialog';
import { LivepollDialogComponent } from '../livepoll-dialog/livepoll-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import {
  LivepollService,
  LivepollSessionPatchAPI,
} from '../../../../services/http/livepoll.service';
import { SessionService } from 'app/services/util/session.service';
import { LivepollSession } from '../../../../models/livepoll-session';

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss'],
})
export class LivepollCreateComponent implements OnDestroy {
  public readonly templateGroups = templateGroups;

  public readonly translateKey = 'common';
  public templateSelection = new FormControl<LivepollTemplateContext>(
    templateContext[0],
  );

  public livepollConfiguration: LivepollSession = new LivepollSession();
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
  }

  create() {
    this.dialogRef.close(this.livepollConfiguration);
    this.createAPI();
  }

  createAPI() {
    this.livepollService.create(this.livepollConfiguration);
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  test() {
    console.log('yeet');
  }
}
