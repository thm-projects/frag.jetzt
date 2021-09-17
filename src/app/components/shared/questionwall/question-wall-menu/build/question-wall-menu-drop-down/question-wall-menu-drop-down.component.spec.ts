import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionWallMenuDropDownComponent } from './question-wall-menu-drop-down.component';

describe('QuestionWallMenuDropDownComponent', () => {
  let component: QuestionWallMenuDropDownComponent;
  let fixture: ComponentFixture<QuestionWallMenuDropDownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionWallMenuDropDownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionWallMenuDropDownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
