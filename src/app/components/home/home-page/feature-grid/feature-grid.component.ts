import { Component, HostBinding, Input } from '@angular/core';
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
  MatCardSubtitle,
  MatCardActions,
} from '@angular/material/card';
import { M3WindowSizeClass } from '../../../../../modules/m3/components/navigation/m3-navigation-types';

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
    MatCardSubtitle,
    MatCardActions,
    NgClass,
  ],
  templateUrl: './feature-grid.component.html',
  styleUrl: './feature-grid.component.scss',
})
export class FeatureGridComponent {
  protected readonly carousel = carousel;
  protected readonly Math = Math;
  protected flippedCardIndex: number | null = null;

  protected featureState = false; // oder true, je nach Anforderung

  protected readonly windowClass = windowWatcher.windowState;
  protected readonly language = language;

  protected toggleCard(index: number): void {
    // Wenn wir auf die bereits umgedrehte Karte klicken, einfach zurückdrehen
    if (this.flippedCardIndex === index) {
      this.flippedCardIndex = null;
      return;
    }

    // Wenn bereits eine andere Karte umgedreht ist
    if (this.flippedCardIndex !== null) {
      const previousIndex = this.flippedCardIndex;
      // Zuerst die alte Karte zurückdrehen
      this.flippedCardIndex = null;

      // Erst nach VERKÜRZTER Verzögerung die neue Karte umdrehen
      setTimeout(() => {
        this.flippedCardIndex = index;
      }, 700); // Von 1500ms auf 700ms reduziert - gerade noch lang genug, um die Sequenz zu erkennen
    } else {
      // Wenn keine Karte umgedreht ist, sofort die neue umdrehen
      this.flippedCardIndex = index;
    }
  }

  protected isCardFlipped(index: number): boolean {
    return this.flippedCardIndex === index;
  }

  @HostBinding('class.asDialog') get _asDialog() {
    return this.isDialog;
  }

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('isDialog') set _isDialog(value: boolean) {
    this.isDialog = value;
  }
  private isDialog: boolean;

  get currentWindowClass(): M3WindowSizeClass {
    if (this.isDialog) {
      return M3WindowSizeClass.Compact;
    } else {
      return this.windowClass();
    }
  }

  get carouselWindow() {
    return this.carousel.window[this.currentWindowClass];
  }

  constructor(protected self: HomePageService) {}
}
