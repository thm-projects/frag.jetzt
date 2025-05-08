// src/app/components/shared/app-rating/_dialogs/app-rating-pop-up/app-rating-pop-up.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AppRatingPopUpComponent } from './app-rating-pop-up.component';
import { RatingResult } from '../../../../models/rating-result';
import { of } from 'rxjs';

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
      // Leeres Template, damit keine Pipes/Markup probleme machen
      .overrideComponent(AppRatingPopUpComponent, {
        set: { template: `` },
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

  it('rating signal formats to one decimal place', () => {
    expect((component as any).rating()).toBe('4.3');
  });

  it('people signal returns the number of people as string', () => {
    expect((component as any).people()).toContain('57');
  });

  describe('getIconAccumulated()', () => {
    it('returns full star when rounded rating ≥ index+1', () => {
      // 4.3 rounds to 4.0 or 4.5 depending auf logic; hier testen wir index 0..3
      expect(component.getIconAccumulated(0)).toBe('star_full');
    });

    it('returns half star when index < rounded rating < index+1', () => {
      expect(component.getIconAccumulated(4)).toBe('star_half');
    });

    it('returns border when rounded rating ≤ index', () => {
      expect(component.getIconAccumulated(5)).toBe('star_border');
    });
  });

  it('static openDialogAt() calls MatDialog.open and sets result', () => {
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
});
