import { Component, Input, OnInit } from '@angular/core';
import { TagCloudDataTagEntry } from '../tag-cloud.data-manager';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TagCloudComponent } from '../tag-cloud.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { User } from '../../../../models/user';
import {retagTsFile} from "@angular/compiler-cli/src/ngtsc/shims";

@Component({
  selector: 'app-tag-cloud-pop-up',
  templateUrl: './tag-cloud-pop-up.component.html',
  styleUrls: ['./tag-cloud-pop-up.component.scss']
})
export class TagCloudPopUpComponent implements OnInit {

  @Input() parent: TagCloudComponent;
  tag: string;
  tagData: TagCloudDataTagEntry;
  categories: string[];
  timePeriodText: string;
  user: User;

  constructor(private langService: LanguageService,
              private translateService: TranslateService,
              private authenticationService: AuthenticationService) {
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.show(false);
    this.timePeriodText = '...';
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
  }

  initPopUp(tag: string, tagData: TagCloudDataTagEntry) {
    this.show(true);
    this.tag = tag;
    this.tagData = tagData;
    this.categories = Array.from(tagData.categories.keys());
    this.calculateDateText();
  }

  addBlacklistWord(): void {
    this.parent.dataManager.blockWord(this.tag);
    this.show(false);
  }

  position(left, top, tagWidth, tagHeight) {
    const html = document.querySelector('.popupContainer') as HTMLElement;
    const width = html.offsetWidth;
    const tagLeft = left - width * 0.5 + tagWidth * 0.5;
    const tagTop = top - 50;
    html.style.position = 'absolute';
    html.style.top = tagTop + 'px';
    html.style.zIndex = '100';
    html.style.left = ((tagLeft < 0) ? 0 : (tagLeft > window.innerWidth) ? window.innerWidth - tagWidth : tagLeft) + 'px';
  }

  show(visible: boolean) {
    const html = document.querySelector('.popupContainer') as HTMLElement;
    html.style.display = (visible) ? '' : 'none';
    html.classList.add('down');
  }

  private calculateDateText(): void {
    // @ts-ignore
    const diffMs = Date.now() - Date.parse(this.tagData.firstTimeStamp);
    const seconds = Math.floor(diffMs / 1_000);
    if (seconds < 60) {
      // few seconds
      this.translateService.get('tag-cloud-popup.few-seconds').subscribe(e => this.timePeriodText = e);
      return;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 5) {
      // few minutes
      this.translateService.get('tag-cloud-popup.few-minutes').subscribe(e => this.timePeriodText = e);
      return;
    } else if (minutes < 60) {
      // x minutes
      this.translateService.get('tag-cloud-popup.some-minutes', {
        minutes
      }).subscribe(e => this.timePeriodText = e);
      return;
    }
    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
      // 1 hour
      this.translateService.get('tag-cloud-popup.one-hour').subscribe(e => this.timePeriodText = e);
      return;
    } else if (hours < 24) {
      // x hours
      this.translateService.get('tag-cloud-popup.some-hours', {
        hours
      }).subscribe(e => this.timePeriodText = e);
      return;
    }
    const days = Math.floor(hours / 24);
    if (days === 1) {
      // 1 day
      this.translateService.get('tag-cloud-popup.one-day').subscribe(e => this.timePeriodText = e);
      return;
    } else if (days < 7) {
      // x days
      this.translateService.get('tag-cloud-popup.some-days', {
        days
      }).subscribe(e => this.timePeriodText = e);
      return;
    }
    const weeks = Math.floor(days / 7);
    if (weeks === 1) {
      // 1 week
      this.translateService.get('tag-cloud-popup.one-week').subscribe(e => this.timePeriodText = e);
      return;
    } else if (weeks < 12) {
      // x weeks
      this.translateService.get('tag-cloud-popup.some-weeks', {
        weeks
      }).subscribe(e => this.timePeriodText = e);
      return;
    }
    const months = Math.floor(weeks / 4);
    // x months
    this.translateService.get('tag-cloud-popup.some-months', {
      months
    }).subscribe(e => this.timePeriodText = e);
  }
}
