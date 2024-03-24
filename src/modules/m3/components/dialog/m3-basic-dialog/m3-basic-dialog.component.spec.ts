import { ComponentFixture, TestBed } from '@angular/core/testing';

import { M3BasicDialogComponent } from './m3-basic-dialog.component';

describe('M3BasicDialogComponent', () => {
  let component: M3BasicDialogComponent;
  let fixture: ComponentFixture<M3BasicDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [M3BasicDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(M3BasicDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
