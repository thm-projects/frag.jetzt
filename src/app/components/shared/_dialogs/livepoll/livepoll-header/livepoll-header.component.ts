import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { SessionService } from '../../../../../services/util/session.service';
import { ReplaySubject } from 'rxjs';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import { LanguageService } from '../../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { LivepollArchiveComponent } from '../overlay/livepoll-archive/livepoll-archive.component';
import { OverlayService } from '../../../../../services/util/overlay.service';

@Component({
  selector: 'app-livepoll-header',
  templateUrl: './livepoll-header.component.html',
  styleUrls: ['./livepoll-header.component.scss'],
})
export class LivepollHeaderComponent implements OnInit, OnDestroy {
  @Input() title: string;
  @Input() isProduction: boolean;
  @Input() livepollSession: LivepollSession;
  public readonly translateKey: string = 'common';
  public isOpen: boolean;
  private _destroyer = new ReplaySubject(1);

  constructor(
    public readonly session: SessionService,
    public readonly overlay: Overlay,
    public readonly languageService: LanguageService,
    public readonly translationService: TranslateService,
    public readonly http: HttpClient,
    public readonly overlayService: OverlayService,
  ) {
    LivepollComponentUtility.initLanguage(
      this.languageService,
      this.translationService,
      this.http,
      this._destroyer,
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._destroyer.next(1);
  }

  openArchive(event: MouseEvent) {
    console.log(this.livepollSession);
    const ref = this.overlayService.create(
      LivepollArchiveComponent,
      {
        panelClass: 'overlay-row',
      },
      {
        initial: this.livepollSession,
      },
    );
  }
}
