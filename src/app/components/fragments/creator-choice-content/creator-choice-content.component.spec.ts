import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatorChoiceContentComponent } from './creator-choice-content.component';

describe('CreatorChoiceContentComponent', () => {
  let component: CreatorChoiceContentComponent;
  let fixture: ComponentFixture<CreatorChoiceContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatorChoiceContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorChoiceContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
