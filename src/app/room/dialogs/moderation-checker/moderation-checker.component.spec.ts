import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModerationCheckerComponent } from './moderation-checker.component';

describe('ModerationCheckerComponent', () => {
  let component: ModerationCheckerComponent;
  let fixture: ComponentFixture<ModerationCheckerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModerationCheckerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModerationCheckerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
