// src/app/components/shared/_dialogs/app-rating-pop-up/app-rating-pop-up.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AppRatingPopUpComponent } from './app-rating-pop-up.component';
import { RatingResult } from '../../../../models/rating-result';

describe('AppRatingPopUpComponent (class-only tests)', () => {
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
      // stub out template to avoid pipe or markup errors
      .overrideComponent(AppRatingPopUpComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(AppRatingPopUpComponent);
    component = fixture.componentInstance;
    component.result = sampleResult;
    fixture.detectChanges();
  });

  // Component instantiation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Signal formatting
  it('formats rating to one decimal place', () => {
    expect((component as any).rating()).toBe('4.3');
  });

  it('formats people count as string', () => {
    expect((component as any).people()).toContain('57');
  });

  // Icon accumulation logic
  describe('getIconAccumulated()', () => {
    it('returns full stars for indices below rounded rating', () => {
      expect(component.getIconAccumulated(0)).toBe('star_full');
      expect(component.getIconAccumulated(3)).toBe('star_full');
    });

    it('returns half star when rating is between index and index + 1', () => {
      expect(component.getIconAccumulated(4)).toBe('star_half');
    });

    it('returns empty star for indices above rounded rating', () => {
      expect(component.getIconAccumulated(5)).toBe('star_border');
    });
  });

  // Static dialog opener
  it('openDialogAt() opens dialog with correct config and passes result', () => {
    const dialogRef: any = { componentInstance: {} };
    dialogSpy.open.and.returnValue(dialogRef);

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
    expect(dialogRef.componentInstance.result).toBe(sampleResult);
  });

  // Exhaustive tests for various rating values
  describe('exhaustive rating scenarios', () => {
    type TestCase = { rating: number; expected: string[] };
    const cases: TestCase[] = [
      {
        rating: 0.2,
        expected: [
          'star_border',
          'star_border',
          'star_border',
          'star_border',
          'star_border',
          'star_border',
        ],
      },
      {
        rating: 1.25,
        expected: [
          'star_full',
          'star_half',
          'star_border',
          'star_border',
          'star_border',
          'star_border',
        ],
      },
      {
        rating: 2.5,
        expected: [
          'star_full',
          'star_full',
          'star_half',
          'star_border',
          'star_border',
          'star_border',
        ],
      },
      {
        rating: 4.75,
        expected: [
          'star_full',
          'star_full',
          'star_full',
          'star_full',
          'star_full',
          'star_border',
        ],
      },
    ];

    cases.forEach(({ rating, expected }) => {
      it(`rating ${rating} => icons [${expected.join(', ')}]`, () => {
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

        expected.forEach((icon, idx) => {
          expect(component.getIconAccumulated(idx))
            .withContext(`index ${idx} for rating ${rating}`)
            .toBe(icon);
        });
      });
    });

    it('rating() and people() update when result changes', () => {
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
});
