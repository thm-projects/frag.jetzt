import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SwUpdate } from '@angular/service-worker';
import { NotificationService } from './services/util/notification.service';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';
import { Rescale } from './models/rescale';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private static scrollAnimation = true;

  constructor(private translationService: TranslateService,
              private update: SwUpdate,
              public notification: NotificationService,
              private matIconRegistry: MatIconRegistry,
              private domSanitizer: DomSanitizer) {
    translationService.setDefaultLang(this.translationService.getBrowserLang());
    sessionStorage.setItem('currentLang', this.translationService.getBrowserLang());
    for (const icon of this.icons) {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icons/' + icon + '.svg')
      );
    }
  }

  public static rescale: Rescale = new Rescale();

  icons = [
    'beamer',
    'meeting_room'
  ];

  title = 'frag.jetzt';

  public static scrollTop() {
    const sc: HTMLElement = document.getElementById('scroll_container');
    if (AppComponent.scrollAnimation) {
      const interval = setInterval(() => {
        if (sc.scrollTop > 0) {sc.scrollTop -= 10; } else {
          sc.scrollTop = 0;
          clearInterval(interval);
        }
      }, 1);
    } else {
      sc.scrollTop = 0;
    }
  }

  public static isScrolledTop(): boolean {
    return document.getElementById('scroll_container').scrollTop === 0;
  }

  ngOnInit(): void {
    this.update.available.subscribe(update => {
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
