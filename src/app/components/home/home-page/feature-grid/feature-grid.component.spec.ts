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

describe('FeatureGridComponent', () => {
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
  it('sollte den Kartenzustand korrekt verwalten', () => {
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
});
