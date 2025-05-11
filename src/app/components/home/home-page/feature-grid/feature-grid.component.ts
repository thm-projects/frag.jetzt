import {
  Component,
  HostBinding,
  Input,
  QueryList,
  ViewChildren,
  ElementRef,
  AfterViewInit,
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
export class FeatureGridComponent implements AfterViewInit {
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
   * Stop all videos that may be playing (update to include YouTube)
   */
  private stopAllVideos(): void {
    // Stop regular videos
    document.querySelectorAll('.feature-video').forEach((videoElement) => {
      const video = videoElement as HTMLVideoElement;
      if (video && !video.paused) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // For YouTube iframes, send postMessage to pause
    document.querySelectorAll('iframe').forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(
          '{"event":"command","func":"pauseVideo","args":""}',
          '*',
        );
      } catch (e) {
        console.warn('Could not pause YouTube video:', e);
      }
    });
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

  constructor(protected self: HomePageService) {}

  ngAfterViewInit() {
    this.setupImageObserver(); // Keep only the IntersectionObserver
  }

  /**
   * Load images for visible cards
   */
  private loadCardImages(): void {
    // Get all lazy-loaded images
    const images = document.querySelectorAll(
      'img[data-src]',
    ) as NodeListOf<HTMLImageElement>;

    images.forEach((img) => {
      if (!img.src && img.dataset['src']) {
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
   * Formats image alt text to remove redundant words and provide fallbacks
   * @param alt Original alt text from data
   * @param fallback Fallback text (usually title)
   * @returns Cleaned alt text for better accessibility
   */
  protected formatAltText(alt: string | undefined, fallback: string): string {
    if (!alt) {
      return fallback;
    }

    // Remove redundant words that screen readers already announce
    return (
      alt.replace(/\b(image|picture|photo|icon)\b/gi, '').trim() || fallback
    );
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
   * @param index The index of the card
   */
  protected onYoutubeLoaded(index: number): void {
    console.log(`YouTube video for card ${index} loaded`);
    // You could implement additional logic here if needed
  }

  /**
   * Checks if a card is considered large based on its window configuration
   * @param index The index of the card
   * @returns True if the card is large, false otherwise
   */
  protected isLargeCard(index: number): boolean {
    // Make sure index is valid
    if (index < 0 || index >= this.carousel.entries.length) {
      return false;
    }

    const entry = this.carousel.entries[index];
    // If using a signal for window class, use function call syntax
    const currentWindowClass =
      typeof this.windowClass === 'function'
        ? this.windowClass()
        : this.windowClass;

    const currentWindow = entry.window?.[currentWindowClass];
    return currentWindow?.colspan >= 2 || currentWindow?.rowspan >= 2;
  }

  /**
   * Gets the video title (YouTube or regular) for a card
   * @param index The card index
   * @returns The video title or empty string
   */
  protected getVideoTitle(index: number): string {
    const entry = this.carousel.entries[index];
    if (entry?.content.youtube?.title) {
      return entry.content.youtube.title;
    } else if (entry?.content.video?.title) {
      return entry.content.video.title;
    }
    return '';
  }

  /**
   * Checks if a card has a summary
   * @param index The card index
   * @returns True if the card has a summary, false otherwise
   */
  protected hasSummary(index: number): boolean {
    const hasSum = !!this.carousel.entries[index]?.content.youtube?.summary;
    console.log(
      `Card ${index} has summary: ${hasSum}`,
      this.carousel.entries[index]?.content.youtube?.summary,
    );
    return hasSum;
  }
}
