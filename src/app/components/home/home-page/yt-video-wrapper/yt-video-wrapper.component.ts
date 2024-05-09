import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { AppStateService } from '../../../../services/state/app-state.service';
import { Language } from '../../../../services/http/languagetool.service';
import { LanguageKey } from '../home-page-types';

const LanguageKeyToImageURL: { [A in LanguageKey]: string } = {
  de: '/assets/images/youtube-start_de.webp',
  en: '/assets/images/youtube-start_en.webp',
  fr: '/assets/images/youtube-start_fr.webp',
};
const LanguageKeyToEmbedURL: { [A in LanguageKey]: string } = {
  de: 'https://www.youtube-nocookie.com/embed/de8UG1oeH30',
  en: 'https://www.youtube-nocookie.com/embed/Ownrdlb5e5Q',
  fr: 'https://www.youtube-nocookie.com/embed/Hn6UW3Lzjaw',
};

@Component({
  selector: 'app-yt-video-wrapper',
  standalone: true,
  imports: [NgIf],
  templateUrl: './yt-video-wrapper.component.html',
  styleUrl: './yt-video-wrapper.component.scss',
})
export class YtVideoWrapperComponent {
  iframeSrc: SafeUrl;
  imageSrc: string;
  isAccepted = false;
  @ViewChild('scaledIframe')
  scaledIframe: ElementRef<HTMLIFrameElement>;
  currentLanguage: Language = 'en';
  private readonly _destroyer: Subject<number> = new ReplaySubject(1);

  constructor(sanitizer: DomSanitizer, appState: AppStateService) {
    appState.language$.pipe(takeUntil(this._destroyer)).subscribe((lang) => {
      this.currentLanguage = lang;
      this.isAccepted = false;
      this.imageSrc = LanguageKeyToImageURL[this.currentLanguage];
      this.iframeSrc = sanitizer.bypassSecurityTrustResourceUrl(
        LanguageKeyToEmbedURL[this.currentLanguage],
      );
    });
  }

  onResize() {
    const style = this.scaledIframe?.nativeElement;
    if (!style) {
      return;
    }
    const height = (parseFloat(getComputedStyle(style).width) * 9) / 16;
    style.height = height.toFixed(2) + 'px';
  }
}
