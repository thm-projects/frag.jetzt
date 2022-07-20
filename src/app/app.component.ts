import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SwUpdate } from '@angular/service-worker';
import { NotificationService } from './services/util/notification.service';
import { Rescale } from './models/rescale';
import { CustomIconService } from './services/util/custom-icon.service';
import { filter } from 'rxjs/operators';
import { SessionService } from './services/util/session.service';

import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';
import { LanguageService } from './services/util/language.service';
import {
  NotifyUnsupportedBrowserComponent
} from './components/home/_dialogs/notify-unsupported-browser/notify-unsupported-browser.component';
import { MatDialog } from '@angular/material/dialog';
import { DeviceInfoService } from './services/util/device-info.service';
import { MatomoTrackingService } from './services/util/matomo-tracking.service';
import { TitleService } from './services/util/title.service';

Quill.register('modules/imageResize', ImageResize);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  public static rescale: Rescale = new Rescale();
  private static scrollAnimation = true;
  @ViewChild('headerElement')
  headerElement: ElementRef<HTMLElement>;
  @ViewChild('footerElement')
  footerElement: ElementRef<HTMLElement>;
  @ViewChild('scrollElement')
  scrollElement: ElementRef<HTMLElement>;
  title = 'frag.jetzt';
  private _lastScrollTop = 0;

  constructor(
    private translationService: TranslateService,
    private update: SwUpdate,
    private sessionService: SessionService,
    public notification: NotificationService,
    private customIconService: CustomIconService,
    private languageService: LanguageService,
    private dialog: MatDialog,
    private deviceInfo: DeviceInfoService,
    private matomoTrackingService: MatomoTrackingService,
    private titleService: TitleService,
  ) {
    customIconService.init();
    this.translationService.setDefaultLang(this.languageService.currentLanguage());
  }

  public static scrollTop() {
    const sc: HTMLElement = document.getElementById('scroll_container');
    if (AppComponent.scrollAnimation) {
      sc.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      sc.scrollTop = 0;
    }
  }

  public static isScrolledTop(): boolean {
    return document.getElementById('scroll_container').scrollTop === 0;
  }

  ngOnInit(): void {
    this.update.versionUpdates.pipe(
      filter(e => e.type === 'VERSION_READY'),
    ).subscribe(update => {
      let install: string;
      this.translationService.get('home-page.install').subscribe(msg => {
        install = msg;
      });
      this.translationService.get('home-page.update-available').subscribe(msg => {
        this.notification.show(msg, install, {
          duration: 5000,
        });
      });
      this.notification.snackRef.afterDismissed().subscribe(info => {
        if (info.dismissedByAction === true) {
          window.location.reload();
        }
      });
    });
    if (this.deviceInfo.isSafari) {
      this.dialog.open(NotifyUnsupportedBrowserComponent, {
        width: '600px'
      });
    }
  }

  public getRescale(): Rescale {
    return AppComponent.rescale;
  }

  onScroll() {
    const scroller = this.scrollElement.nativeElement;
    const current = scroller.scrollTop;
    if (Math.abs(this._lastScrollTop - current) <= 10 && current > 0) {
      return;
    }
    const header = this.headerElement.nativeElement;
    const footer = this.footerElement.nativeElement;
    if (current > this._lastScrollTop && current > header.offsetHeight) {
      header.style.marginTop = '-' + header.offsetHeight + 'px';
    } else {
      header.style.marginTop = '0';
    }
    const height = scroller.scrollHeight - scroller.clientHeight - footer.offsetHeight;
    if (current > this._lastScrollTop && current < height) {
      footer.style.marginBottom = '-' + footer.offsetHeight + 'px';
    } else {
      footer.style.marginBottom = '0';
    }
    this._lastScrollTop = current;
  }

}
