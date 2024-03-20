import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallDrawerComponent } from './question-wall-drawer.component';

describe('QuestionWallDrawerComponent', () => {
  let component: QuestionWallDrawerComponent;
  let fixture: ComponentFixture<QuestionWallDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionWallDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionWallDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
