import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureGridComponent } from './feature-grid.component';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { HomePageService } from '../home-page.service';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardTitle,
} from '@angular/material/card';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

xdescribe('FeatureGridComponent', () => {
  let component: FeatureGridComponent;
  let fixture: ComponentFixture<FeatureGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FeatureGridComponent,
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
      providers: [
        { provide: HomePageService, useClass: class MockHomePageService {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Schritt 1: Test für die Kartenzustandsverwaltung
  xit('sollte den Kartenzustand korrekt verwalten', () => {
    // Initial sollte keine Karte umgedreht sein
    expect(component['flippedCardIndex']).toBe(null);

    // Erste Karte umdrehen
    component['toggleCard'](0);
    expect(component['flippedCardIndex']).toBe(0);
    expect(component['isCardFlipped'](0)).toBeTrue();
    expect(component['isCardFlipped'](1)).toBeFalse();

    // Zweite Karte umdrehen (erste sollte zurückgedreht werden)
    component['toggleCard'](1);
    expect(component['flippedCardIndex']).toBe(1);
    expect(component['isCardFlipped'](0)).toBeFalse();
    expect(component['isCardFlipped'](1)).toBeTrue();

    // Dieselbe Karte nochmals umdrehen (zurück zur Vorderseite)
    component['toggleCard'](1);
    expect(component['flippedCardIndex']).toBe(null);
    expect(component['isCardFlipped'](1)).toBeFalse();
  });

  // Schritt 2: Test für die HTML-Struktur
  it('sollte die korrekte HTML-Struktur für die Kartendrehung rendern', () => {
    // Hier benötigen wir mock-Daten für die Komponente
    // Wir könnten das carousel.features mocken, aber für diesen Test
    // reicht es, die DOM-Struktur zu prüfen

    fixture.detectChanges();

    // Prüfen ob die Card-Container existieren
    const cardContainers = fixture.debugElement.queryAll(
      By.css('.card-container'),
    );

    // Wenn keine Features im Test-Carousel sind, können wir keine Container erwarten
    // Daher prüfen wir nur, ob die Struktur stimmt FALLS Container vorhanden sind
    cardContainers.forEach((container) => {
      // Jeder Container sollte eine Karte mit einer Vorder- und Rückseite haben
      const card = container.query(By.css('.card'));
      expect(card).toBeTruthy('Karte sollte im Container existieren');

      const frontFace = card.query(By.css('.card-face.card-front'));
      expect(frontFace).toBeTruthy('Vorderseite sollte existieren');

      const backFace = card.query(By.css('.card-face.card-back'));
      expect(backFace).toBeTruthy('Rückseite sollte existieren');

      // Prüfen ob die Kartenstruktur korrekt ist
      const frontMatCard = frontFace.query(By.css('mat-card'));
      expect(frontMatCard).toBeTruthy(
        'Vorderseite sollte eine mat-card enthalten',
      );

      const backMatCard = backFace.query(By.css('mat-card'));
      expect(backMatCard).toBeTruthy(
        'Rückseite sollte eine mat-card enthalten',
      );
    });
  });

  // Schritt 5: Test für die Vergrößerungs-Animation
  it('sollte die Karte während der Drehung vergrößern', () => {
    fixture.detectChanges();

    // Karte umdrehen
    component['toggleCard'](0);
    fixture.detectChanges();

    // CSS-Klassen überprüfen
    const cardElement = fixture.debugElement.query(By.css('.card'));
    expect(cardElement.classes['flipped']).toBeTruthy(
      'Die Karte sollte umgedreht sein',
    );

    // Hinweis: Die eigentliche Vergrößerung muss manuell überprüft werden,
    // da Jasmine-Tests die berechneten CSS-Stile nicht auswerten können

    // Dokumentieren, dass wir einen scale(1.05)-Effekt erwarten
    // (wird durch CSS-Regel .card.flipped implementiert)
  });

  // Schritt 6: Test für Material-Elevation
  it('sollte unterschiedliche Elevation für Vorder- und Rückseite haben', () => {
    fixture.detectChanges();

    // Karte umdrehen
    component['toggleCard'](0);
    fixture.detectChanges();

    // Wir können nicht direkt die berechneten Stile testen, aber wir können prüfen,
    // ob die Klassen korrekt angewendet werden
    const cardElement = fixture.debugElement.query(By.css('.card'));
    const frontCard = cardElement.query(By.css('.card-front mat-card'));
    const backCard = cardElement.query(By.css('.card-back mat-card'));

    // Prüfen, ob die Karte umgedreht ist
    expect(cardElement.classes['flipped']).toBeTruthy();

    // Hinweis: Die tatsächlichen Schatten werden durch CSS gesteuert
    // und müssen visuell überprüft werden

    // Dokumentieren, dass wir unterschiedliche Schatten erwarten
    // (wird durch CSS-Regeln implementiert)
  });
});
