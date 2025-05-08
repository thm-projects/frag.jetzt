// src/app/components/shared/_dialogs/app-rating-pop-up/app-rating-pop-up.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AppRatingPopUpComponent } from './app-rating-pop-up.component';
import { RatingResult } from '../../../../models/rating-result';

describe('AppRatingPopUpComponent (class-only)', () => {
  let fixture: ComponentFixture<AppRatingPopUpComponent>;
  let component: AppRatingPopUpComponent;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const sampleResult: RatingResult = {
    rating: 4.3,
    people: 57,
    fiveStarPercent: 50,
    fourStarPercent: 20,
    threeStarPercent: 15,
    twoStarPercent: 10,
    oneStarPercent: 5,
  };

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      declarations: [AppRatingPopUpComponent],
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    })
      .overrideComponent(AppRatingPopUpComponent, {
        set: { template: '' }, // leeres Template, um Pipes/Markup zu umgehen
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppRatingPopUpComponent);
    component = fixture.componentInstance;
    component.result = sampleResult;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('formats rating to one decimal place', () => {
    expect((component as any).rating()).toBe('4.3');
  });

  it('formats people count as string', () => {
    expect((component as any).people()).toContain('57');
  });

  describe('getIconAccumulated()', () => {
    it('returns "star_full" for indexes below rounded rating', () => {
      // 4.3 rounds to 4.5 → full for indices 0–3
      expect(component.getIconAccumulated(0)).toBe('star_full');
      expect(component.getIconAccumulated(3)).toBe('star_full');
    });

    it('returns "star_half" when rating is between index and index+1', () => {
      expect(component.getIconAccumulated(4)).toBe('star_half');
    });

    it('returns "star_border" for indexes above rounded rating', () => {
      expect(component.getIconAccumulated(5)).toBe('star_border');
    });
  });

  it('static openDialogAt() calls MatDialog.open and sets result', () => {
    const dialogRef = { componentInstance: {} };
    dialogSpy.open.and.returnValue(dialogRef as any);

    AppRatingPopUpComponent.openDialogAt(dialogSpy, sampleResult);

    expect(dialogSpy.open).toHaveBeenCalledWith(
      AppRatingPopUpComponent,
      jasmine.objectContaining({
        width: '90vw',
        maxWidth: '500px',
        minWidth: 'min(90vw, 500px)',
        autoFocus: false,
      }),
    );
    expect((dialogRef as any).componentInstance.result).toBe(sampleResult);
  });

  describe('exhaustive getIconAccumulated for various ratings', () => {
    type Case = { rating: number; icons: string[] };
    const cases: Case[] = [
      // 0.2*2=0.4→round0→0.0
      {
        rating: 0.2,
        icons: [
          'star_border',
          'star_border',
          'star_border',
          'star_border',
          'star_border',
          'star_border',
        ],
      },
      // 1.25*2=2.5→round3→1.5
      {
        rating: 1.25,
        icons: [
          'star_full',
          'star_half',
          'star_border',
          'star_border',
          'star_border',
          'star_border',
        ],
      },
      // 2.5*2=5→round5→2.5
      {
        rating: 2.5,
        icons: [
          'star_full',
          'star_full',
          'star_half',
          'star_border',
          'star_border',
          'star_border',
        ],
      },
      // 4.75*2=9.5→round10→5.0
      {
        rating: 4.75,
        icons: [
          'star_full',
          'star_full',
          'star_full',
          'star_full',
          'star_full',
          'star_border',
        ],
      },
    ];

    for (const { rating, icons } of cases) {
      it(`rating ${rating} → icons ${icons.join(',')}`, () => {
        component.result = {
          ...sampleResult,
          rating,
          people: 0,
          fiveStarPercent: 0,
          fourStarPercent: 0,
          threeStarPercent: 0,
          twoStarPercent: 0,
          oneStarPercent: 0,
        };
        fixture.detectChanges();
        icons.forEach((expected, idx) => {
          expect(component.getIconAccumulated(idx))
            .withContext(`index ${idx}`)
            .toBe(expected);
        });
      });
    }
  });

  it('rating() and people() adapt to updated result values', () => {
    component.result = {
      rating: 2.718,
      people: 300,
      fiveStarPercent: 0,
      fourStarPercent: 0,
      threeStarPercent: 0,
      twoStarPercent: 0,
      oneStarPercent: 0,
    };
    fixture.detectChanges();
    expect((component as any).rating()).toBe('2.7');
    expect((component as any).people()).toContain('300');
  });
});
