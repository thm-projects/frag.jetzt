import {
  Component,
  computed,
  ElementRef,
  Input,
  inject,
  ViewChild,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LanguageKey } from '../home-page-types';
import { language } from 'app/base/language/language';

const IMAGE_URLS: Record<LanguageKey, string> = {
  de: '/assets/images/youtube-start_de.webp',
  en: '/assets/images/youtube-start_en.webp',
  fr: '/assets/images/youtube-start_fr.webp',
};

const EMBED_URLS: Record<LanguageKey, string> = {
  de: 'https://www.youtube-nocookie.com/embed/de8UG1oeH30',
  en: 'https://www.youtube-nocookie.com/embed/Ownrdlb5e5Q',
  fr: 'https://www.youtube-nocookie.com/embed/Hn6UW3Lzjaw',
};

@Component({
  selector: 'app-yt-video-wrapper',
  standalone: true,
  imports: [NgIf],
  templateUrl: './yt-video-wrapper.component.html',
  styleUrls: ['./yt-video-wrapper.component.scss'],
})
export class YtVideoWrapperComponent {
  @Input() langKey?: LanguageKey;
  isAccepted = false;
  readonly componentId =
    'yt-video-' + Math.random().toString(36).substring(2, 11);

  @ViewChild('scaledIframe') scaledIframe?: ElementRef<HTMLIFrameElement>;
  @ViewChild('videoRegion') videoRegion?: ElementRef<HTMLElement>;
  private readonly sanitizer = inject(DomSanitizer);

  private readonly currentLang = computed<LanguageKey>(() => {
    if (this.langKey) {
      return this.langKey;
    }
    const sig = language();
    return sig === 'en' || sig === 'de' || sig === 'fr' ? sig : 'en';
  });

  readonly imageSrc = computed(() => IMAGE_URLS[this.currentLang()]);

  readonly iframeSrc = computed<SafeResourceUrl>(() => {
    // force captions on by default
    const url = `${EMBED_URLS[this.currentLang()]}?cc_load_policy=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  readonly videoTitle = computed(() => {
    const lang = this.currentLang();
    let title: string;
    if (lang === 'en') {
      title = 'Introduction to frag.jetzt';
    } else if (lang === 'de') {
      title = 'Einführung in frag.jetzt';
    } else {
      title = 'Présentation de frag.jetzt';
    }
    return title;
  });

  playVideo(): void {
    this.isAccepted = true;
    // move focus into the iframe for screen readers / keyboard users
    setTimeout(() => {
      this.scaledIframe?.nativeElement.focus();
    }, 0);
  }

  onResize(): void {
    const el = this.scaledIframe?.nativeElement;
    if (!el) return;
    const width = parseFloat(getComputedStyle(el).width);
    el.style.height = `${((width * 9) / 16).toFixed(2)}px`;
  }
}
