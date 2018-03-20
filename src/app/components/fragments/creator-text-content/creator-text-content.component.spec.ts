import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatorTextContentComponent } from './creator-text-content.component';

describe('CreatorTextContentComponent', () => {
  let component: CreatorTextContentComponent;
  let fixture: ComponentFixture<CreatorTextContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatorTextContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorTextContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
