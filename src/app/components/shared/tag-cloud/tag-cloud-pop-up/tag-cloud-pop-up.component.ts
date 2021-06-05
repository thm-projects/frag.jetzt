import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TagCloudDataTagEntry } from '../tag-cloud.data-manager';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TagCloudComponent } from '../tag-cloud.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { User } from '../../../../models/user';

const CLOSE_TIME = 1500;

@Component({
  selector: 'app-tag-cloud-pop-up',
  templateUrl: './tag-cloud-pop-up.component.html',
  styleUrls: ['./tag-cloud-pop-up.component.scss']
})
export class TagCloudPopUpComponent implements OnInit, AfterViewInit {

  @Input() parent: TagCloudComponent;
  @ViewChild('popupContainer') popupContainer: ElementRef;
  tag: string;
  tagData: TagCloudDataTagEntry;
  categories: string[];
  timePeriodText: string;
  user: User;
  private _popupHoverTimer: number;
  private _popupCloseTimer: number;

  constructor(private langService: LanguageService,
              private translateService: TranslateService,
              private authenticationService: AuthenticationService) {
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.timePeriodText = '...';
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
  }

  ngAfterViewInit() {
    const html = this.popupContainer.nativeElement as HTMLDivElement;
    html.addEventListener('mouseenter', () => {
      clearTimeout(this._popupCloseTimer);
    });
    html.addEventListener('mouseleave', () => {
      this._popupCloseTimer = setTimeout(() => {
        this.close();
      }, CLOSE_TIME);
    });
  }

  onFocus(event) {
    if (!this.popupContainer.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  leave(): void {
    clearTimeout(this._popupHoverTimer);
    this._popupCloseTimer = setTimeout(() => {
      this.close();
    }, CLOSE_TIME);
  }

  enter(elem: HTMLElement, tag: string, tagData: TagCloudDataTagEntry, hoverDelayInMs: number): void {
    clearTimeout(this._popupCloseTimer);
    clearTimeout(this._popupHoverTimer);
    this._popupHoverTimer = setTimeout(() => {
      this.tag = tag;
      this.tagData = tagData;
      this.categories = Array.from(tagData.categories.keys());
      this.calculateDateText(() => {
        this.position(elem);
      });
    }, hoverDelayInMs);
  }

  addBlacklistWord(): void {
    this.parent.dataManager.blockWord(this.tag);
    this.close();
  }

  close(): void {
    const html = this.popupContainer.nativeElement as HTMLDivElement;
    html.classList.remove('up', 'down', 'right', 'left');
  }

  private position(elem: HTMLElement) {
    const html = this.popupContainer.nativeElement as HTMLDivElement;
    const rect = html.getBoundingClientRect();
    const sub = elem.getBoundingClientRect();
    //Berechnung für Platz
    html.style.top = (sub.y - rect.height - 10) + 'px';
    html.style.left = (sub.x + (sub.width - rect.width) / 2) + 'px';
    html.classList.add('down');
    html.focus();
  }

  private calculateDateText(afterInit: () => void): void {
    const subscriber = (e: string) => {
      this.timePeriodText = e;
      if (afterInit) {
        setTimeout(afterInit);
      }
    };
    // @ts-ignore
    const diffMs = Date.now() - Date.parse(this.tagData.firstTimeStamp);
    const seconds = Math.floor(diffMs / 1_000);
    if (seconds < 60) {
      // few seconds
      this.translateService.get('tag-cloud-popup.few-seconds').subscribe(subscriber);
      return;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 5) {
      // few minutes
      this.translateService.get('tag-cloud-popup.few-minutes').subscribe(subscriber);
      return;
    } else if (minutes < 60) {
      // x minutes
      this.translateService.get('tag-cloud-popup.some-minutes', {
        minutes
      }).subscribe(subscriber);
      return;
    }
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      // 1 hour
      this.translateService.get('tag-cloud-popup.one-hour').subscribe(subscriber);
      return;
    } else if (hours < 24) {
      // x hours
      this.translateService.get('tag-cloud-popup.some-hours', {
        hours
      }).subscribe(subscriber);
      return;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      // 1 day
      this.translateService.get('tag-cloud-popup.one-day').subscribe(subscriber);
      return;
    } else if (days < 7) {
      // x days
      this.translateService.get('tag-cloud-popup.some-days', {
        days
      }).subscribe(subscriber);
      return;
    }
    const weeks = Math.floor(days / 7);
    if (weeks === 1) {
      // 1 week
      this.translateService.get('tag-cloud-popup.one-week').subscribe(subscriber);
      return;
    } else if (weeks < 12) {
      // x weeks
      this.translateService.get('tag-cloud-popup.some-weeks', {
        weeks
      }).subscribe(subscriber);
      return;
    }
    const months = Math.floor(weeks / 4);
    // x months
    this.translateService.get('tag-cloud-popup.some-months', {
      months
    }).subscribe(subscriber);
  }
}
