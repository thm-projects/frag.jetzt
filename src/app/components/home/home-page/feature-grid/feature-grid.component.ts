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
   * Toggles a card's flipped state and announces the change for screen readers
   * @param index The index of the card to toggle
   */
  protected toggleCard(index: number): void {
    if (this.flippedCardIndex === index) {
      this.flippedCardIndex = null;
      // Announce to screen reader
      this.announceToScreenReader(`Card ${index + 1} flipped back.`);
    } else {
      this.flippedCardIndex = index;
      // Announce to screen reader
      this.announceToScreenReader(
        `Card ${index + 1} flipped. Details are now visible.`,
      );
    }

    // Set focus on the currently activated card
    this.focusCardRobust(index);
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
    // This could be used to override querySelectorAll with a more robust version
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
}
