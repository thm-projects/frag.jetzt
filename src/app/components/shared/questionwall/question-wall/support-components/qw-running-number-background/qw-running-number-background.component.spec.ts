import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QwRunningNumberBackgroundComponent } from './qw-running-number-background.component';

describe('QwCommentQuestionerBackgroundComponent', () => {
  let component: QwRunningNumberBackgroundComponent;
  let fixture: ComponentFixture<QwRunningNumberBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QwRunningNumberBackgroundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QwRunningNumberBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
