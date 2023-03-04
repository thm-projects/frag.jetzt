import { Component, OnDestroy } from '@angular/core';
import {
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

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss'],
})
export class LivepollCreateComponent implements OnDestroy {
  public readonly templateGroups = templateGroups;

  public readonly translateKey = 'create';
  public templateSelection = new FormControl<LivepollTemplateContext>(
    templateContext[0],
  );

  public selectedPreviewOption: number = -1;
  public livepollConfiguration: LivepollConfiguration =
    defaultLivepollConfiguration;
  private _destroyer = new ReplaySubject(1);

  constructor(
    public readonly dialogRef: DialogRef<LivepollConfiguration>,
    public readonly translationService: TranslateService,
    public readonly languageService: LanguageService,
    public readonly http: HttpClient,
    public readonly device: DeviceInfoService,
    // only for mockup, remove when no.3 works
    public readonly _dialog: MatDialog,
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

  public static create(dialog: MatDialog) {
    dialog.open(LivepollCreateComponent, {});
  }

  /**
   * only for mockup, remove when no.3 works
   */
  public static createMockup(dialog: MatDialog, asParticipant: boolean) {
    const ref = dialog.open(LivepollDialogComponent, {});
    ref.componentInstance.userRole = asParticipant
      ? UserRole.PARTICIPANT
      : UserRole.CREATOR;
  }

  create() {
    this.dialogRef.close(this.livepollConfiguration);
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  /**
   * only for mockup, remove when no.3 works
   */
  openMockup(asParticipant: boolean) {
    LivepollCreateComponent.createMockup(this._dialog, asParticipant);
  }
}
