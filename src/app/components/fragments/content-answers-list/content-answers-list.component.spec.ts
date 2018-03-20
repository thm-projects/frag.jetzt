import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentAnswersListComponent } from './content-answers-list.component';

describe('ContentAnswersListComponent', () => {
  let component: ContentAnswersListComponent;
  let fixture: ComponentFixture<ContentAnswersListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContentAnswersListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentAnswersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
