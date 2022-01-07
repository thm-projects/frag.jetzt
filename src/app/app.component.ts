import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SwUpdate } from '@angular/service-worker';
import { NotificationService } from './services/util/notification.service';
import { Rescale } from './models/rescale';
import { CustomIconService } from './services/util/custom-icon.service';
import { MatomoInjector } from 'ngx-matomo-v9';
import { environment } from '../environments/environment';
import { filter } from 'rxjs/operators';
import { SessionService } from './services/util/session.service';

import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';
import { LanguageService } from './services/util/language.service';

Quill.register('modules/imageResize', ImageResize);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public static rescale: Rescale = new Rescale();
  private static scrollAnimation = true;

  title = 'frag.jetzt';

  constructor(
    private translationService: TranslateService,
    private update: SwUpdate,
    private matomoInjector: MatomoInjector,
    private sessionService: SessionService,
    public notification: NotificationService,
    private customIconService: CustomIconService,
    private languageService: LanguageService,
  ) {
    customIconService.init();
    if (environment.name === 'prod') {
      this.matomoInjector.init('https://arsnova.thm.de/stats/', 6);
    }
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
      filter(e => e.type === 'VERSION_READY')
    ).subscribe(update => {
      let install: string;
      this.translationService.get('home-page.install').subscribe(msg => {
        install = msg;
      });
      this.translationService.get('home-page.update-available').subscribe(msg => {
        this.notification.show(msg, install, {
          duration: 10000
        });
      });
      this.notification.snackRef.afterDismissed().subscribe(info => {
        if (info.dismissedByAction === true) {
          window.location.reload();
        }
      });
    });
  }

  public getRescale(): Rescale {
    return AppComponent.rescale;
  }


}
