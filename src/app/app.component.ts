import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SwUpdate } from '@angular/service-worker';
import { NotificationService } from './services/util/notification.service';
import { Rescale } from './models/rescale';
import { CustomIconService } from './services/util/custom-icon.service';
import { filter } from 'rxjs/operators';
import { StartUpService } from './services/util/start-up.service';
import { EventService } from './services/util/event.service';
import {
  LivepollDialogRequest,
  LivepollDialogResponse,
  LoginDialogRequest,
  LoginDialogResponse,
  MotdDialogRequest,
  RescaleRequest,
  RescaleResponse,
  sendEvent,
} from './utils/service-component-events';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from './components/shared/login/login.component';
import { MotdDialogComponent } from './components/shared/_dialogs/motd-dialog/motd-dialog.component';
import { Router } from '@angular/router';
import { DeviceInfoService } from './services/util/device-info.service';
import { UpdateInfoDialogComponent } from './components/home/_dialogs/update-info-dialog/update-info-dialog.component';
import { LivepollDialogComponent } from './components/shared/_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { LivepollCreateComponent } from './components/shared/_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { LivepollSummaryComponent } from './components/shared/_dialogs/livepoll/livepoll-summary/livepoll-summary.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public static rescale: Rescale = new Rescale();
  public static instance: AppComponent;
  private static scrollAnimation = true;
  @ViewChild('headerElement')
  headerElement: ElementRef<HTMLElement>;
  @ViewChild('footerElement')
  footerElement: ElementRef<HTMLElement>;
  @ViewChild('scrollElement')
  scrollElement: ElementRef<HTMLElement>;
  title = 'frag.jetzt';
  rescaleActive: boolean = false;
  private _lastScrollTop = 0;

  constructor(
    private _startUp: StartUpService,
    private translationService: TranslateService,
    private update: SwUpdate,
    public notification: NotificationService,
    private customIconService: CustomIconService,
    private eventService: EventService,
    private dialog: MatDialog,
    public router: Router,
    public deviceInfo: DeviceInfoService,
  ) {
    AppComponent.instance = this;
    this.initDialogsForServices();
    customIconService.init();
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
    this.update.versionUpdates
      .pipe(filter((e) => e.type === 'VERSION_READY'))
      .subscribe((_) => UpdateInfoDialogComponent.open(this.dialog));
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
    const height =
      scroller.scrollHeight - scroller.clientHeight - footer.offsetHeight;
    if (current > this._lastScrollTop && current < height) {
      footer.style.marginBottom = '-' + footer.offsetHeight + 'px';
    } else {
      footer.style.marginBottom = '0';
    }
    this._lastScrollTop = current;
  }

  private initDialogsForServices() {
    this.eventService
      .on<LoginDialogRequest>(LoginDialogRequest.name)
      .subscribe((request) => {
        const dialogRef = this.dialog.open(LoginComponent, {
          width: '350px',
        });
        dialogRef.componentInstance.redirectUrl = request.redirectUrl;
        dialogRef.afterClosed().subscribe(() => {
          sendEvent(this.eventService, new LoginDialogResponse());
        });
      });
    this.eventService
      .on<RescaleRequest>(RescaleRequest.name)
      .subscribe((request) => {
        let scale;
        if (request.scale === 'initial') {
          scale = this.getRescale().getInitialScale();
        } else {
          scale = request.scale;
        }
        this.getRescale().setScale(scale);
        sendEvent(this.eventService, new RescaleResponse());
      });
    this.eventService
      .on<MotdDialogRequest>(MotdDialogRequest.name)
      .subscribe((request) => {
        const dialogRef = this.dialog.open(MotdDialogComponent, {
          width: '80%',
          maxWidth: '600px',
          minHeight: '95%',
          height: '95%',
        });
        dialogRef.componentInstance.motds = request.motds;
        dialogRef.afterClosed().subscribe(() => {
          sendEvent(this.eventService, new LoginDialogResponse());
        });
      });
    this.eventService
      .on<LivepollDialogRequest>(LivepollDialogRequest.name)
      .subscribe((request) => {
        if (request.dialog === 'dialog') {
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              this.dialog.open(LivepollDialogComponent, request.config),
            ),
          );
        } else if (request.dialog === 'create') {
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              this.dialog.open(LivepollCreateComponent, request.config),
            ),
          );
        } else if (request.dialog === 'summary') {
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              this.dialog.open(LivepollSummaryComponent, request.config),
            ),
          );
        }
      });
  }
}
