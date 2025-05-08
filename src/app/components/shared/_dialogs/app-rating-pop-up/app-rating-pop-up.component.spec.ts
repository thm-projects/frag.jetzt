// src/app/components/shared/_dialogs/app-rating-pop-up/app-rating-pop-up.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

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
      .overrideComponent(AppRatingPopUpComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(AppRatingPopUpComponent);
    component = fixture.componentInstance;
    component.result = sampleResult;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formats people count correctly (locale-aware)', () => {
    expect((component as any).people()).toBe(
      sampleResult.people.toLocaleString(),
    );
  });

  describe('getIconAccumulated()', () => {
    it('full stars for indices below rounded rating', () => {
      expect(component.getIconAccumulated(0)).toBe('star_full');
      expect(component.getIconAccumulated(3)).toBe('star_full');
    });

    it('half star when rating between index and index + 1', () => {
      expect(component.getIconAccumulated(4)).toBe('star_half');
    });

    it('empty star for indices above rounded rating', () => {
      expect(component.getIconAccumulated(5)).toBe('star_border');
    });
  });

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

  it('handles multiple rating scenarios correctly', () => {
    const scenarios: { rating: number; expected: string[] }[] = [
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

    for (const { rating, expected } of scenarios) {
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

      for (const [idx, icon] of expected.entries()) {
        expect(component.getIconAccumulated(idx))
          .withContext(`rating ${rating}, index ${idx}`)
          .toBe(icon);
      }
    }
  });
});
