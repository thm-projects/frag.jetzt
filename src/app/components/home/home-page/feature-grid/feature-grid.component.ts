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
export class FeatureGridComponent implements AfterViewInit {
  protected readonly carousel = carousel;
  protected readonly Math = Math;
  protected flippedCardIndex: number | null = null;

  protected featureState = false; // oder true, je nach Anforderung

  protected readonly windowClass = windowWatcher.windowState;
  protected readonly language = language;

  @ViewChildren('cardContainer') cardContainers: QueryList<ElementRef>;

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

    // Fokus auf die gerade aktivierte Karte setzen
    this.focusCardRobust(index);
  }

  protected isCardFlipped(index: number): boolean {
    return this.flippedCardIndex === index;
  }

  protected handleKeydown(event: KeyboardEvent, index: number): void {
    const totalCards = this.carousel.entries.length;
    let targetIndex = index;

    // Tab-Taste abfangen und zyklische Navigation implementieren
    if (event.key === 'Tab') {
      if (!event.shiftKey && index === totalCards - 1) {
        // Normale Tab-Taste auf der letzten Karte → zur ersten Karte springen
        event.preventDefault();
        this.focusCardRobust(0);
        return;
      } else if (event.shiftKey && index === 0) {
        // Shift+Tab auf der ersten Karte → zur letzten Karte springen
        event.preventDefault();
        this.focusCardRobust(totalCards - 1);
        return;
      }
      // Sonst normales Tabbing erlauben
      return;
    }

    // Enter oder Space drücken dreht die Karte um
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleCard(index);
      return; // Frühes Return, um weitere Verarbeitung zu vermeiden
    }

    // Navigation basierend auf Taste
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        targetIndex = (index + 1) % totalCards;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        targetIndex = (index - 1 + totalCards) % totalCards;
        break;
      case 'Home':
        event.preventDefault();
        targetIndex = 0; // Erste Karte
        break;
      case 'End':
        event.preventDefault();
        targetIndex = totalCards - 1; // Letzte Karte
        break;
      default:
        return; // Andere Tasten nicht verarbeiten
    }

    // Index geändert? Dann fokussieren
    if (targetIndex !== index) {
      this.focusCardRobust(targetIndex);
    }
  }

  private focusCardRobust(index: number): void {
    // Länger warten, um DOM-Updates zu ermöglichen
    setTimeout(() => {
      try {
        // Versuch 1: Über QueryList (bevorzugt)
        if (this.cardContainers && this.cardContainers.toArray()[index]) {
          const element = this.cardContainers.toArray()[index].nativeElement;
          element.focus();
          return;
        }

        // Versuch 2: Über Document Query
        const cards = document.querySelectorAll('.card-container');
        if (cards && cards[index]) {
          (cards[index] as HTMLElement).focus();
          return;
        }

        console.warn('Konnte Karte nicht fokussieren:', index);
      } catch (e) {
        console.error('Fehler beim Fokussieren der Karte:', e);
      }
    }, 50); // Längere Verzögerung für bessere Zuverlässigkeit
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

  ngAfterViewInit() {
    // Überschreibe die querySelectorAll-Methode mit einer robusteren Variante
  }

  // Berechnen der korrekten tabindex-Werte basierend auf Grid-Position
  protected getTabIndex(index: number): number {
    // Anzahl Karten pro Zeile ermitteln (basierend auf cols-Wert)
    const cardsPerRow = this.getCardsPerRow();

    // Zeile und Spalte berechnen
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;

    // Tabindex berechnen: zeilenweise Reihenfolge
    return row * cardsPerRow + col + 1; // +1, damit wir bei 1 starten
  }

  // Ermittelt Karten pro Zeile basierend auf aktuellem Layout
  private getCardsPerRow(): number {
    const windowSize = this.windowClass();

    // Korrekte Enum-Werte verwenden, nicht String-Literale
    if (windowSize === M3WindowSizeClass.Compact) {
      return 1; // Mobile: eine Karte pro Zeile
    } else if (windowSize === M3WindowSizeClass.Medium) {
      return 2; // Tablet: zwei Karten pro Zeile
    } else {
      // Expanded und andere größere Formate
      return 3; // Desktop: drei Karten pro Zeile
    }
  }
}
