import { Component, OnDestroy, Renderer2 } from '@angular/core';
import {
  defaultLivepollTemplate,
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
import { MatSelect } from '@angular/material/select';
import { LivepollComponentUtility } from '../livepoll-component-utility';

@Component({
  selector: 'app-livepoll-create',
  templateUrl: './livepoll-create.component.html',
  styleUrls: ['./livepoll-create.component.scss', '../livepoll-common.scss'],
})
export class LivepollCreateComponent implements OnDestroy {
  public readonly templateGroups: LivepollGroupContext[] = templateGroups;

  public readonly translateKey = 'common';
  public templateSelection = new FormControl<LivepollTemplateContext>(
    defaultLivepollTemplate,
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
    private readonly renderer: Renderer2,
  ) {
    LivepollComponentUtility.initLanguage(
      this.languageService,
      this.translationService,
      this.http,
      this._destroyer,
    );
    this.livepollConfiguration = new LivepollSession({} as LivepollSession);
  }

  public create() {
    this.dialogRef.close(this.livepollConfiguration);
    this.livepollService
      .create({
        roomId: this.sessionService.currentRoom.id,
        template: this.livepollConfiguration.template,
        title: this.livepollConfiguration.title,
        resultVisible: this.livepollConfiguration.resultVisible,
        viewsVisible: this.livepollConfiguration.viewsVisible,
        customEntries: [],
      })
      .subscribe();
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  public overrideHeight($event: boolean, matSelect: MatSelect) {
    const height =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;
    this.renderer.setStyle(
      matSelect.panel.nativeElement,
      'max-height',
      height -
        10 -
        matSelect.panel.nativeElement.getBoundingClientRect().y +
        'px',
    );
  }
}
