import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultilevelDialogComponent } from './multilevel-dialog.component';

describe('MultilevelDialogComponent', () => {
  let component: MultilevelDialogComponent;
  let fixture: ComponentFixture<MultilevelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultilevelDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultilevelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
