import {
  Component,
  computed,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { LanguageKey } from '../home-page-types';
import { language } from 'app/base/language/language';

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
  imports: [NgIf],
  templateUrl: './yt-video-wrapper.component.html',
  styleUrl: './yt-video-wrapper.component.scss',
})
export class YtVideoWrapperComponent {
  isAccepted = false;
  @ViewChild('scaledIframe')
  scaledIframe: ElementRef<HTMLIFrameElement>;
  readonly imageSrc = computed(() => {
    const lang = language();
    this.isAccepted = false;
    return LanguageKeyToImageURL[lang];
  });
  private readonly sanitizer = inject(DomSanitizer);
  readonly iframeSrc = computed(() => {
    const lang = language();
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      LanguageKeyToEmbedURL[lang],
    );
  });

  onResize() {
    const style = this.scaledIframe?.nativeElement;
    if (!style) {
      return;
    }
    const height = (parseFloat(getComputedStyle(style).width) * 9) / 16;
    style.height = height.toFixed(2) + 'px';
  }
}
