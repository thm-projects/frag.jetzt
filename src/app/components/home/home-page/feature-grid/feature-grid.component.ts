import {
  Component,
  HostBinding,
  Input,
  QueryList,
  ViewChildren,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { carousel } from '../home-page-carousel';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { HomePageService } from '../home-page.service';
import { windowWatcher } from '../../../../../modules/navigation/utils/window-watcher';
import { language } from '../../../../base/language/language';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardTitle,
} from '@angular/material/card';
import { M3WindowSizeClass } from '../../../../../modules/m3/components/navigation/m3-navigation-types';
import { YoutubeEmbedComponent } from '../youtube-embed/youtube-embed.component';
import { environment } from '../../../../../environments/environment';

/**
 * Component that displays features in an interactive grid with flip cards
 */
@Component({
  selector: 'app-feature-grid',
  imports: [
    MatGridList,
    MatGridTile,
    MatIcon,
    MatIconButton,
    NgTemplateOutlet,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardImage,
    MatCardTitle,
    NgClass,
    YoutubeEmbedComponent,
  ],
  templateUrl: './feature-grid.component.html',
  styleUrl: './feature-grid.component.scss',
})
export class FeatureGridComponent implements AfterViewInit, OnInit {
  protected readonly carousel = carousel;
  protected readonly Math = Math;
  protected flippedCardIndex: number | null = null;

  // State for feature (can be true or false based on requirements)
  protected featureState = false;

  protected readonly windowClass = windowWatcher.windowState;
  protected readonly language = language;

  @ViewChildren('cardContainer') cardContainers: QueryList<ElementRef>;

  /**
   * Toggles a card's flipped state and handles video playback
   * @param index The index of the card to toggle
   */
  protected toggleCard(index: number): void {
    // Save current flipped state for later comparison
    const wasFlipped = this.flippedCardIndex === index;

    // First, stop any currently playing videos
    this.stopAllVideos();

    if (wasFlipped) {
      // Card is being flipped back to front
      this.flippedCardIndex = null;
      // Announce to screen reader
      this.announceToScreenReader(`Card ${index + 1} flipped back.`);
    } else {
      // If another card was flipped, reset its state
      this.flippedCardIndex = index;

      // Announce to screen reader
      this.announceToScreenReader(
        `Card ${index + 1} flipped. Details are now visible.`,
      );

      // Add a slight delay for videos
      if (this.carousel.entries[index]?.content.video) {
        // Handle regular videos as before
        setTimeout(() => {
          const cards = document.querySelectorAll('.card');
          if (cards[index]) {
            const video =
              cards[index].querySelector<HTMLVideoElement>('.feature-video');
            if (video) {
              video.load();
              setTimeout(() => {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.catch(() => {
                    console.log(
                      'Autoplay prevented by browser - manual play required',
                    );
                  });
                }
              }, 100);
            }
          }
        }, 800);
      }
      // No special handling needed for YouTube - the component handles it
    }
  }

  /**
   * Stops all videos when switching cards
   * Note: Only stops HTML5 videos, not YouTube embeds (due to iframe security limitations)
   */
  private stopAllVideos(): void {
    // Stop HTML5 videos
    const videos =
      document.querySelectorAll<HTMLVideoElement>('.feature-video');
    videos.forEach((video) => {
      if (!video.paused) {
        video.pause();
        // Don't reset currentTime - this can cause issues with some video players
        // video.currentTime = 0;
      }
    });

    // YouTube videos cannot be reliably controlled due to iframe security restrictions
    // We could add a message to inform users that they need to manually pause
    // YouTube videos before navigating away
  }

  /**
   * Checks if a card is currently flipped
   * @param index The card index to check
   * @returns True if the card is flipped, false otherwise
   */
  protected isCardFlipped(index: number): boolean {
    return this.flippedCardIndex === index;
  }

  /**
   * Handles keyboard navigation between cards
   * @param event The keyboard event
   * @param index The current card index
   */
  protected handleKeydown(event: KeyboardEvent, index: number): void {
    const totalCards = this.carousel.entries.length;

    // Handle Tab key for cyclic navigation
    if (event.key === 'Tab') {
      if (!event.shiftKey && index === totalCards - 1) {
        // Regular Tab on last card → jump to first card
        event.preventDefault();
        this.focusCardRobust(0);
        return;
      } else if (event.shiftKey && index === 0) {
        // Shift+Tab on first card → jump to last card
        event.preventDefault();
        this.focusCardRobust(totalCards - 1);
        return;
      }
      // Allow normal tabbing otherwise
      return;
    }

    // Enter or Space flips the card
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleCard(index);
      return; // Early return to avoid further processing
    }

    // Handle scrolling in screenshot-text content
    if (
      this.isCardFlipped(index) &&
      this.carousel.entries[index]?.content.screenshotText &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      const textContainer = this.elementRef.nativeElement.querySelector(
        '.card.flipped .explanation-text-container',
      );

      if (textContainer) {
        const scrollAmount = 30;

        if (event.key === 'ArrowDown') {
          textContainer.scrollTop += scrollAmount;
          event.preventDefault();
        } else if (event.key === 'ArrowUp') {
          textContainer.scrollTop -= scrollAmount;
          event.preventDefault();
        }

        return; // Don't process further navigation when scrolling
      }
    }

    // Navigation based on key
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.focusCardRobust((index + 1) % totalCards);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.focusCardRobust((index - 1 + totalCards) % totalCards);
        break;
      case 'Home':
        event.preventDefault();
        this.focusCardRobust(0); // First card
        break;
      case 'End':
        event.preventDefault();
        this.focusCardRobust(totalCards - 1); // Last card
        break;
    }
  }

  /**
   * Handle keyboard events for videos
   * @param event The keyboard event
   */
  protected handleVideoKeydown(event: KeyboardEvent): void {
    // Stop event from bubbling up to card container
    event.stopPropagation();

    // Handle space and enter as click for video controls
    if (event.key === 'Enter' || event.key === ' ') {
      // Let browser handle these natively for video controls
    }
  }

  /**
   * Focus a specific card with robust error handling
   * @param index The index of the card to focus
   */
  private focusCardRobust(index: number): void {
    setTimeout(() => {
      try {
        // Use optional chaining for cleaner code
        const element = this.cardContainers?.toArray()[index]?.nativeElement;
        if (element) {
          element.focus();
          return;
        }

        // Try 2: Via Document Query
        const card = document.querySelectorAll('.card-container')[
          index
        ] as HTMLElement;
        card?.focus();

        if (!element && !card) {
          console.warn('Could not focus card:', index);
        }
      } catch (e) {
        console.error('Error focusing card:', e);
      }
    }, 50); // Longer delay for better reliability
  }

  /**
   * Announces a message to screen readers
   * @param message The message to announce
   */
  private announceToScreenReader(message: string): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.classList.add('sr-only');
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  @HostBinding('class.asDialog') get _asDialog() {
    return this.isDialog;
  }

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('isDialog') set _isDialog(value: boolean) {
    this.isDialog = value;
  }
  private isDialog: boolean;

  /**
   * Gets the current window class considering dialog mode
   */
  get currentWindowClass(): M3WindowSizeClass {
    if (this.isDialog) {
      return M3WindowSizeClass.Compact;
    } else {
      return this.windowClass();
    }
  }

  /**
   * Gets the carousel window for the current display size
   */
  get carouselWindow() {
    return this.carousel.window[this.currentWindowClass];
  }

  constructor(
    protected self: HomePageService,
    private readonly elementRef: ElementRef,
  ) {}

  ngOnInit() {
    // Entferne die fehlgeschlagenen Übersetzungsversuche
    // Behalte nur grundlegende Initialisierung
  }

  ngAfterViewInit() {
    this.setupImageObserver();

    // Add small-card class to small card containers
    setTimeout(() => {
      this.cardContainers.forEach((container, index) => {
        if (!this.isLargeCard(index)) {
          container.nativeElement.classList.add('small-card');
        }
      });
    });

    // Add this line to detect small cards
    setTimeout(() => {
      this.markSmallCards();
    });
  }

  /**
   * Load images for visible cards
   */
  private loadCardImages(): void {
    // Remove the unnecessary type assertion
    const images = document.querySelectorAll('img[data-src]');

    // Check type inside the loop instead
    images.forEach((img) => {
      if (img instanceof HTMLImageElement && img.dataset['src']) {
        img.src = img.dataset['src'];
      }
    });
  }

  /**
   * Sets up intersection observer for better image lazy loading
   */
  private setupImageObserver(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img instanceof HTMLImageElement && img.dataset['src']) {
              img.src = img.dataset['src'];
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadCardImages();
    }
  }

  /**
   * Calculates the correct tabindex based on grid position
   * @param index The card index
   * @returns The tabindex value for natural grid navigation order
   */
  protected getTabIndex(index: number): number {
    // Determine cards per row (based on cols value)
    const cardsPerRow = this.getCardsPerRow();

    // Calculate row and column
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;

    // Calculate tabindex: row-wise order
    return row * cardsPerRow + col + 1; // +1 so we start at 1
  }

  /**
   * Determines cards per row based on current layout
   * @returns Number of cards to display per row
   */
  private getCardsPerRow(): number {
    const windowSize = this.windowClass();

    // Use correct enum values
    if (windowSize === M3WindowSizeClass.Compact) {
      return 1; // Mobile: one card per row
    } else if (windowSize === M3WindowSizeClass.Medium) {
      return 2; // Tablet: two cards per row
    } else {
      // Expanded and other larger formats
      return 3; // Desktop: three cards per row
    }
  }

  /**
   * Formats alt text for improved accessibility
   * Removes redundant words that screen readers already announce
   *
   * @param alt The original alt text from the content
   * @param title Fallback title if alt text is not provided
   * @returns Properly formatted alt text without redundant terms
   */
  protected formatAltText(
    alt: string | undefined,
    title: string | undefined,
  ): string {
    // If no alt text, use title or empty string
    if (!alt) {
      return title || '';
    }

    // Remove redundant words from beginning of alt text
    const redundantPrefixes = [
      'image',
      'image of',
      'picture',
      'picture of',
      'photo',
      'photo of',
      'icon',
      'icon of',
      'screenshot',
      'screenshot of',
      'graphic',
      'graphic of',
    ];

    let cleanedAlt = alt.trim();
    for (const prefix of redundantPrefixes) {
      const pattern = new RegExp(`^${prefix}\\s+`, 'i');
      if (pattern.test(cleanedAlt)) {
        cleanedAlt = cleanedAlt.replace(pattern, '');
        break;
      }
    }

    // Capitalize first letter for better readability
    if (cleanedAlt.length > 0) {
      cleanedAlt = cleanedAlt.charAt(0).toUpperCase() + cleanedAlt.slice(1);
    }

    return cleanedAlt || title || '';
  }

  /**
   * Cleans the alt text for image attributes
   * @param altText The alt text to clean
   * @param fallback Fallback text if altText is empty
   * @returns Cleaned alt text
   */
  protected cleanAltText(
    altText: string | undefined,
    fallback: string,
  ): string {
    if (!altText || altText.trim() === '') {
      return fallback || '';
    }
    // Remove the word "image" from alt text (as recommended by SonarLint)
    return altText.replace(/image/gi, '').trim();
  }

  /**
   * Adds an unmute button overlay to a muted autoplaying video
   */
  private addUnmuteButton(
    video: HTMLVideoElement,
    container: HTMLElement,
  ): void {
    // Only add if video is actually muted and playing
    if (!video.muted || video.paused) return;

    const unmuteBtn = document.createElement('button');
    unmuteBtn.className = 'video-unmute-button';
    unmuteBtn.innerHTML = '<mat-icon>volume_up</mat-icon> Unmute';
    unmuteBtn.onclick = (e) => {
      e.stopPropagation();
      video.muted = false;
      unmuteBtn.remove();
    };

    container.querySelector('.video-container')?.appendChild(unmuteBtn);
  }

  /**
   * Adds a play button for browsers that block autoplay completely
   */
  private addPlayButton(video: HTMLVideoElement, container: HTMLElement): void {
    const playBtn = document.createElement('button');
    playBtn.className = 'video-play-button';
    playBtn.innerHTML = '<mat-icon>play_arrow</mat-icon> Play Video';
    playBtn.onclick = (e) => {
      e.stopPropagation();
      video.play().catch(console.error);
      playBtn.remove();
    };

    container.querySelector('.video-container')?.appendChild(playBtn);
  }

  /**
   * Handles YouTube video loaded event
   * @param index Index of the card containing the video
   */
  protected onYoutubeLoaded(index: number): void {
    // Log successful load for debugging
    console.log(`YouTube video for card ${index} loaded`);
  }

  /**
   * Checks if a card is considered large based on its window configuration
   * @param index The index of the card
   * @returns True if the card is large, false otherwise
   */
  protected isLargeCard(index: number): boolean {
    const entry = this.carousel.entries[index];
    if (!entry) {
      return false;
    }

    const currentWindowClass =
      typeof this.windowClass === 'function'
        ? this.windowClass()
        : this.windowClass;

    const currentWindow = entry.window?.[currentWindowClass];
    return (
      (currentWindow?.colspan ?? 0) >= 2 || (currentWindow?.rowspan ?? 0) >= 2
    );
  }

  /**
   * Gets the video title (YouTube or regular) for a card
   * @param index The card index
   * @returns The video title or empty string
   */
  protected getVideoTitle(index: number): string {
    const entry = this.carousel.entries[index];
    if (!entry) {
      return '';
    }

    if (entry.content.youtube?.title) {
      return entry.content.youtube.title;
    } else if (entry.content.video?.title) {
      return entry.content.video.title;
    }
    return '';
  }

  /**
   * Checks if the entry has a video summary
   * @param index The card index
   * @returns True if summary exists
   */
  protected hasSummary(index: number): boolean {
    const summary = this.carousel.entries[index]?.content.youtube?.summary;
    if (!summary) {
      return false;
    }

    // If it's an object, check if it has any language entries
    if (typeof summary !== 'string') {
      return Object.values(summary).some((text) => !!text);
    }

    // If it's a string, check if it's non-empty
    return !!summary;
  }

  /**
   * Gets the summary text (fallback to English)
   * @param index The card index
   * @returns The summary text
   */
  protected getSummaryForLanguage(index: number): string {
    const entry = this.carousel.entries[index];
    if (!entry?.content.youtube?.summary) {
      return '';
    }

    const summary = entry.content.youtube.summary;

    // For string format
    if (typeof summary === 'string') {
      return summary;
    }

    // Always use English as fallback
    return summary['en'] || '';
  }

  /**
   * Returns language attribute for summary (always English for now)
   */
  protected getSummaryLanguage(index: number): string {
    return 'en';
  }

  /**
   * Video summary title translations
   */
  protected videoSummaryTitle = {
    en: 'Video Summary',
    de: 'Videozusammenfassung',
    fr: 'Résumé de la vidéo',
  };

  /**
   * Prüft ob alle Übersetzungen vorhanden sind (nur für Entwicklung)
   */
  private verifyAllTranslationsExist(): void {
    if (!environment.production) {
      const missingTranslations = [];

      this.carousel.entries.forEach((entry, index) => {
        if (!entry?.content.youtube?.summary) {
          return;
        }

        const summary = entry.content.youtube.summary;

        // Prüfe nur Objekte (keine Strings)
        if (typeof summary === 'object') {
          const hasDE = Object.hasOwn(summary, 'de');
          const hasEN = Object.hasOwn(summary, 'en');
          const hasFR = Object.hasOwn(summary, 'fr');

          if (!hasDE || !hasEN || !hasFR) {
            missingTranslations.push({
              index,
              // Fix: Verwende Bracket-Notation für Indexsignaturen
              title: entry.content.title?.['en'] || 'Unbekannt',
              hasDE,
              hasEN,
              hasFR,
            });
          }
        }
      });

      if (missingTranslations.length > 0) {
        console.warn('Fehlende Übersetzungen gefunden:', missingTranslations);
      } else {
        console.info(
          'Alle Zusammenfassungen haben Übersetzungen für DE, EN und FR',
        );
      }
    }
  }

  /**
   * Marks small cards by adding a specific class
   */
  private markSmallCards() {
    const cardContainers = document.querySelectorAll('.card-container');
    cardContainers.forEach((container, index) => {
      if (!this.isLargeCard(index)) {
        container.classList.add('small-card');
      }
    });
  }
}
