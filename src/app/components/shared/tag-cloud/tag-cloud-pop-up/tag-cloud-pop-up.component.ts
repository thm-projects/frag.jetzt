import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TagCloudComponent } from '../tag-cloud.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { User } from '../../../../models/user';
import { TagCloudDataTagEntry } from '../../../../services/util/tag-cloud-data.service';

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
    clearTimeout(this._popupCloseTimer);
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
    const popup = html.getBoundingClientRect();
    const tag = elem.getBoundingClientRect();
    const boundingBox = elem.parentElement.getBoundingClientRect();
    // calculate the free space to the left, right, top and bottom from tag
    const spaceLeft = tag.x + tag.width / 2;
    const spaceRight = boundingBox.right - tag.right + tag.width / 2;
    const spaceTop = tag.y - boundingBox.y;
    const spaceBottom = boundingBox.bottom - tag.bottom;
    // set flags if tag is near bounding box
    const isLeft = spaceLeft <= popup.width / 2.0;
    const isRight = spaceRight <= popup.width / 2.0;
    const isTop = spaceTop <= popup.height;
    const isBottom = spaceBottom <= popup.height;

    // try to make a decision where to place the popup outgoing from tag with checks if we are at a border of the viewport
    enum PopupPosition {
      top,
      bottom,
      left,
      right
    }

    let dockingPosition;
    if (isLeft && isTop && !isBottom && !isRight) {
      dockingPosition = PopupPosition.right;
    } else if (isTop && !isLeft && !isRight && !isBottom) {
      dockingPosition = PopupPosition.bottom;
    } else if (isRight && isTop && !isLeft && !isBottom) {
      dockingPosition = PopupPosition.left;
    } else if (isLeft && !isTop && !isRight && !isBottom) {
      dockingPosition = PopupPosition.right;
    } else if (!isLeft && !isTop && !isRight && !isBottom) {
      // default docking when all sides offer enough space
      dockingPosition = PopupPosition.top;
    } else if (isRight && !isTop && !isLeft && !isBottom) {
      dockingPosition = PopupPosition.left;
    } else if (isLeft && isBottom && !isTop && !isRight) {
      dockingPosition = PopupPosition.right;
    } else if (!isLeft && isBottom && !isTop && !isRight) {
      dockingPosition = PopupPosition.top;
    } else if (!isLeft && isBottom && isTop && !isRight) {
      dockingPosition = PopupPosition.left;
    } else {
      /*
       * Find solution for small screens when all sides produce unpleasant results
       */
      dockingPosition = PopupPosition.top;
    }
    html.classList.remove('left', 'right', 'up', 'down');
    if (dockingPosition === PopupPosition.bottom) {
      html.style.top = tag.bottom + 'px';
      html.style.left = tag.x + tag.width / 2 + 'px';
      html.classList.add('up');
    } else if (dockingPosition === PopupPosition.top) {
      html.style.top = tag.y + 'px';
      html.style.left = tag.x + tag.width / 2 + 'px';
      html.classList.add('down');
    } else if (dockingPosition === PopupPosition.left) {
      html.style.top = tag.top + tag.height / 2 + 'px';
      html.style.left = tag.x + 'px';
      html.classList.add('right');
    } else if (dockingPosition === PopupPosition.right) {
      html.style.top = tag.top + tag.height / 2 + 'px';
      html.style.left = tag.right + 'px';
      html.classList.add('left');
    }
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
